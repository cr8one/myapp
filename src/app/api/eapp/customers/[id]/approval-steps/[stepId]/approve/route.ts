import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params

  const steps = await prisma.tokuiCreditRequestApprovalStep.findMany({
    where: { request_id: id },
    orderBy: { step_order: "asc" },
  })
  const target = steps.find(s => s.id === stepId)
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 承認者本人のみ承認可能（メールアドレス照合）
  if (!target.approver_email || target.approver_email !== session.user.email) {
    return NextResponse.json({ error: "このステップの承認者本人のみ承認できます" }, { status: 403 })
  }

  // 自分より前のステップが全て承認済みでなければ承認不可
  const firstPending = steps.find(s => s.status === "未承認")
  if (!firstPending || firstPending.id !== stepId) {
    return NextResponse.json({ error: "前のステップが未承認のため承認できません" }, { status: 400 })
  }

  await prisma.tokuiCreditRequestApprovalStep.update({
    where: { id: stepId },
    data: { status: "承認済み", approved_at: new Date() },
  })

  // 全ステップ承認済みなら申請本体のステータスを更新
  const remaining = steps.filter(s => s.id !== stepId && s.status === "未承認")
  const request = await prisma.tokuiCreditRequest.findUnique({ where: { id } })
  if (remaining.length === 0) {
    await prisma.tokuiCreditRequest.update({
      where: { id },
      data: { status: "承認完了" },
    })
    // 申請者本人へ完了通知
    if (request?.requester_user_id) {
      const requester = await prisma.user.findUnique({ where: { id: request.requester_user_id } })
      if (requester?.email) {
        try {
          await transporter.sendMail({
            from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
            to: requester.email,
            subject: `【得意先申請】承認完了: ${request.company_name ?? ""}（${request.uid}）`,
            text: `${requester.name ?? ""} 様\n\n得意先申請（${request.uid}）が全ての承認ステップを完了しました。\n\nhttps://japansleevesystem.com/dashboard/eapp/customers/${id}`,
          })
        } catch (e) {
          console.error("承認完了メール送信エラー:", e)
        }
      }
    }
  } else {
    // 次の承認者へ通知
    const nextStep = remaining.sort((a, b) => a.step_order - b.step_order)[0]
    if (nextStep.approver_email) {
      try {
        await transporter.sendMail({
          from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
          to: nextStep.approver_email,
          subject: `【得意先申請】承認依頼: ${request?.company_name ?? ""}（${request?.uid ?? ""}）`,
          text: `${nextStep.approver_name ?? ""} 様\n\n得意先申請（${request?.uid ?? ""}）の承認をお願いします。\n\n会社名: ${request?.company_name ?? ""}\n\nhttps://japansleevesystem.com/dashboard/eapp/customers/${id}`,
        })
      } catch (e) {
        console.error("次承認者への通知メール送信エラー:", e)
      }
    }
  }

  const updated = await prisma.tokuiCreditRequestApprovalStep.findMany({
    where: { request_id: id },
    orderBy: { step_order: "asc" },
  })
  return NextResponse.json({ steps: updated, allApproved: remaining.length === 0 })
}
