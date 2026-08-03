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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.tokuiCreditRequest.findUnique({
    where: { id },
    include: {
      files: { orderBy: { uploaded_at: "desc" } },
      approval_steps: { orderBy: { step_order: "asc" } },
    },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { send_mail, ...body } = await req.json()

  const before = await prisma.tokuiCreditRequest.findUnique({ where: { id } })

  const record = await prisma.tokuiCreditRequest.update({
    where: { id },
    data: {
      ...body,
      requested_date: body.requested_date ? new Date(body.requested_date) : undefined,
    },
  })

  // 下書き→申請済みへの初回遷移時のみ、承認ルートのスナップショットを生成
  if (before?.status === "下書き" && record.status === "申請済み" && record.requester_user_id) {
    const userSteps = await prisma.userApproverSetting.findMany({
      where: { user_id: record.requester_user_id },
      orderBy: { step_order: "asc" },
      include: {
        position: { select: { name: true } },
        approver: { select: { name: true, email: true } },
      },
    })
    const commonSteps = await prisma.mApprovalRoute.findMany({
      orderBy: { step_order: "asc" },
      include: {
        position: { select: { name: true } },
        approver: { select: { name: true, email: true } },
      },
    })
    const combined = [...userSteps, ...commonSteps]
    if (combined.length > 0) {
      await prisma.tokuiCreditRequestApprovalStep.createMany({
        data: combined.map((s, idx) => ({
          request_id: record.id,
          step_order: idx + 1,
          position_name: s.position?.name ?? null,
          approver_name: s.approver?.name ?? null,
          approver_email: s.approver?.email ?? null,
        })),
      })
      const firstStep = combined[0]
      if (send_mail !== false && firstStep.approver?.email) {
        try {
          await transporter.sendMail({
            from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
            to: firstStep.approver.email,
            subject: `【得意先申請】承認依頼: ${record.company_name ?? ""}（${record.uid}）`,
            text: `${firstStep.approver.name ?? ""} 様\n\n得意先申請（${record.uid}）の承認をお願いします。\n\n会社名: ${record.company_name ?? ""}\n申請種別: ${record.request_type === "NEW" ? "登録依頼" : "修正依頼"}\n\nhttps://japansleevesystem.com/dashboard/eapp/customers/${record.id}`,
          })
        } catch (e) {
          console.error("承認依頼メール送信エラー:", e)
        }
      }
    }
  }

  return NextResponse.json(record)
}
