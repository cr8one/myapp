import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { formatPcRequestNo } from "@/lib/pc-takeout"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const BASE_URL = "https://japansleevesystem.com/dashboard/eapp/pc-takeout"

type RequestForMail = {
  id: string
  request_no: number
  requester_name: string
  period_start: Date | null
  period_end: Date | null
  device_name: string | null
}

const fmtDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10).replace(/-/g, "/") : "—")

const summary = (r: RequestForMail) =>
  `申請No: ${formatPcRequestNo(r.request_no)}\n申請者: ${r.requester_name}\n持出期間: ${fmtDate(r.period_start)} ～ ${fmtDate(r.period_end)}\n端末: ${r.device_name ?? "—"}\n\n${BASE_URL}/${r.id}`

// 送信に失敗しても、操作は止めない（ログに残すだけ）
async function send(to: string, subject: string, text: string) {
  try {
    await transporter.sendMail({ from: `Japan Sleeve <${process.env.SMTP_FROM}>`, to, subject, text })
  } catch (e) {
    console.error("PC持ち出し申請メール送信エラー:", e)
  }
}

// 承認依頼：今、承認の番が来ている承認者へ送る（同じ順序が複数なら全員）
export async function sendPcApprovalRequestMail(requestId: string) {
  const r = await prisma.pcTakeoutRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true, request_no: true, requester_name: true, period_start: true, period_end: true, device_name: true,
      approval_steps: { select: { step_order: true, status: true, approver_name: true, approver_email: true } },
    },
  })
  if (!r) return
  const remaining = r.approval_steps.filter(s => s.status !== "承認済み")
  if (remaining.length === 0) return
  const nextOrder = Math.min(...remaining.map(s => s.step_order))
  for (const s of remaining.filter(x => x.step_order === nextOrder)) {
    if (!s.approver_email) continue
    await send(
      s.approver_email,
      `【PC持ち出し申請】承認依頼: ${formatPcRequestNo(r.request_no)}`,
      `${s.approver_name ?? ""} 様\n\nPC持ち出し申請の承認をお願いします。\n\n${summary(r)}`
    )
  }
}

// 結果の通知：差戻し・却下を、申請者へ送る。理由を本文に入れる
export async function sendPcResultMailToRequester(requestId: string, action: "差戻し" | "却下", actorName: string, comment: string) {
  const r = await prisma.pcTakeoutRequest.findUnique({
    where: { id: requestId },
    select: { id: true, request_no: true, requester_name: true, requester_id: true, period_start: true, period_end: true, device_name: true },
  })
  if (!r) return
  const requester = await prisma.user.findUnique({ where: { id: r.requester_id }, select: { email: true } })
  if (!requester?.email) return
  const guide = action === "差戻し" ? "内容を直して、再申請してください。" : "この申請は却下され、終了しました。"
  await send(
    requester.email,
    `【PC持ち出し申請】${action}: ${formatPcRequestNo(r.request_no)}`,
    `${r.requester_name} 様\n\nPC持ち出し申請が${action}されました。${guide}\n\n${action}した人: ${actorName}\n理由: ${comment}\n\n${summary(r)}`
  )
}
