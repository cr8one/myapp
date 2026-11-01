import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { slipTypeLabel } from "@/lib/accounting-slip-types"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const BASE_URL = "https://japansleevesystem.com/dashboard/eapp/accounting"

type SlipForMail = { id: string; slip_type: string; title: string; requester_name: string; amount: number }

const slipSummary = (s: SlipForMail) =>
  `種類: ${slipTypeLabel(s.slip_type)}\nタイトル: ${s.title}\n起案者: ${s.requester_name}\n金額: ${s.amount.toLocaleString()}円\n\n${BASE_URL}/${s.id}`

// 送信に失敗しても、操作は止めない（ログに残すだけ）
async function send(to: string, subject: string, text: string) {
  try {
    await transporter.sendMail({ from: `Japan Sleeve <${process.env.SMTP_FROM}>`, to, subject, text })
  } catch (e) {
    console.error("経理精算メール送信エラー:", e)
  }
}

// 承認依頼：今、承認の番が来ている承認者へ送る。
// 前の順序がすべて承認済みで、まだ未承認の、一番小さい順序の承認者が対象（同じ順序が複数なら全員）
export async function sendApprovalRequestMail(slipId: string) {
  const slip = await prisma.acctSlip.findUnique({
    where: { id: slipId },
    select: {
      id: true, slip_type: true, title: true, requester_name: true, amount: true, status: true,
      approval_steps: { select: { step_order: true, status: true, approver_name: true, approver_email: true } },
    },
  })
  if (!slip) return
  const remaining = slip.approval_steps.filter(s => s.status !== "承認済み")
  if (remaining.length === 0) return
  const nextOrder = Math.min(...remaining.map(s => s.step_order))
  for (const s of remaining.filter(x => x.step_order === nextOrder)) {
    if (!s.approver_email) continue
    await send(
      s.approver_email,
      `【経理精算】承認依頼: ${slip.title}`,
      `${s.approver_name ?? ""} 様\n\n経理精算の伝票の承認をお願いします。\n\n${slipSummary(slip)}`
    )
  }
}

// 結果の通知：差戻し・却下を、起案者へ送る。理由を本文に入れる
export async function sendResultMailToRequester(slipId: string, action: "差戻し" | "却下", actorName: string, comment: string) {
  const slip = await prisma.acctSlip.findUnique({
    where: { id: slipId },
    select: { id: true, slip_type: true, title: true, requester_name: true, amount: true, requester_id: true },
  })
  if (!slip) return
  const requester = await prisma.user.findUnique({ where: { id: slip.requester_id }, select: { email: true } })
  if (!requester?.email) return
  const guide = action === "差戻し" ? "内容を直して、再申請してください。" : "この伝票は却下され、終了しました。"
  await send(
    requester.email,
    `【経理精算】${action}: ${slip.title}`,
    `${slip.requester_name} 様\n\n経理精算の伝票が${action}されました。${guide}\n\n${action}した人: ${actorName}\n理由: ${comment}\n\n${slipSummary(slip)}`
  )
}
