import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "465"),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params
  const { send_mail } = await req.json().catch(() => ({ send_mail: true }))

  const voucher = await prisma.voucher.findUnique({ where: { id } })
  if (!voucher || voucher.deleted_flg) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const steps = await prisma.voucherApprovalStep.findMany({ where: { voucher_id: id }, orderBy: { step_order: "asc" } })
  const target = steps.find(s => s.id === stepId)
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!target.approver_email || target.approver_email !== user.email) {
    return NextResponse.json({ error: "このステップの承認者本人のみ承認できます" }, { status: 403 })
  }
  const firstPending = steps.find(s => s.status === "未承認")
  if (!firstPending || firstPending.id !== stepId) {
    return NextResponse.json({ error: "前のステップが未承認のため承認できません" }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.voucherApprovalStep.update({ where: { id: stepId }, data: { status: "承認済み", approved_at: new Date() } })
    await tx.voucherHistory.create({
      data: { voucher_id: id, kind: "承認", field_name: target.step_name ?? "承認", after_value: "承認済み", actor_id: user.id, actor_name: user.name ?? null },
    })
  })

  const next = steps.filter(s => s.id !== stepId && s.status === "未承認").sort((a, b) => a.step_order - b.step_order)[0]
  if (send_mail !== false && next?.approver_email) {
    const no = String(voucher.file_no).padStart(6, "0")
    try {
      await transporter.sendMail({
        from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
        to: next.approver_email,
        subject: `【証憑管理】${next.step_name ?? "確認"}依頼: ${voucher.partner_name}（${no}）`,
        text: `${next.approver_name ?? ""} 様\n\n証憑（${no}）の${next.step_name ?? "確認"}をお願いします。\n\n書類区分: ${voucher.doc_type}\n取引先名: ${voucher.partner_name}\n金額: ${voucher.amount.toLocaleString("ja-JP")}円\n\n以下のURLから確認してください。\nhttps://japansleevesystem.com/dashboard/voucher/${id}`,
      })
    } catch (e) {
      console.error("証憑の次承認者への通知メール送信エラー:", e)
    }
  }

  const updated = await prisma.voucherApprovalStep.findMany({ where: { voucher_id: id }, orderBy: { step_order: "asc" } })
  return NextResponse.json({ steps: updated })
}
