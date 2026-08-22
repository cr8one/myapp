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
  const { send_mail, approval_steps, ...body } = await req.json()

  const before = await prisma.tokuiCreditRequest.findUnique({ where: { id } })

  const record = await prisma.tokuiCreditRequest.update({
    where: { id },
    data: {
      ...body,
      requested_date: body.requested_date ? new Date(body.requested_date) : undefined,
    },
  })

  // 下書き→申請済みへの初回遷移時のみ、承認ルートのスナップショットを生成
  // approval_stepsが明示的に渡された場合はそれを優先（その場で追加・削除・編集された内容）、
  // なければ①申請者の承認者設定 → ②得意先共通承認者設定 の順で自動生成
  if (before?.status === "下書き" && record.status === "申請済み" && record.requester_user_id) {
    let combined: { position_name: string | null; approver_name: string | null; approver_email: string | null }[] = []

    if (Array.isArray(approval_steps) && approval_steps.length > 0) {
      const userIds: string[] = approval_steps.map((s: { approver_user_id?: string }) => s.approver_user_id).filter((v: string | undefined): v is string => !!v)
      const approvers = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
      combined = approval_steps
        .slice()
        .sort((a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order)
        .map((s: { position_name?: string; approver_user_id?: string }) => {
          const approver = approvers.find(a => a.id === s.approver_user_id)
          return {
            position_name: s.position_name || null,
            approver_name: approver?.name ?? null,
            approver_email: approver?.email ?? null,
          }
        })
    } else {
      const userSteps = await prisma.userApproverSetting.findMany({
        where: { user_id: record.requester_user_id, service_type: "tokui_credit" },
        orderBy: { step_order: "asc" },
        include: {
          position: { select: { name: true } },
          approver: { select: { name: true, email: true } },
        },
      })
      const commonSteps = await prisma.mApprovalRoute.findMany({
        where: { service_type: "tokui_credit" },
        orderBy: { step_order: "asc" },
        include: {
          position: { select: { name: true } },
          approver: { select: { name: true, email: true } },
        },
      })
      combined = [...userSteps, ...commonSteps].map(s => ({
        position_name: s.position?.name ?? null,
        approver_name: s.approver?.name ?? null,
        approver_email: s.approver?.email ?? null,
      }))
    }

    if (combined.length > 0) {
      await prisma.tokuiCreditRequestApprovalStep.createMany({
        data: combined.map((s, idx) => ({
          request_id: record.id,
          step_order: idx + 1,
          position_name: s.position_name,
          approver_name: s.approver_name,
          approver_email: s.approver_email,
        })),
      })
      const firstStep = combined[0]
      if (send_mail !== false && firstStep.approver_email) {
        try {
          await transporter.sendMail({
            from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
            to: firstStep.approver_email,
            subject: `【得意先申請】承認依頼: ${record.company_name ?? ""}（${record.uid}）`,
            text: `${firstStep.approver_name ?? ""} 様\n\n得意先申請（${record.uid}）の承認をお願いします。\n\n会社名: ${record.company_name ?? ""}\n申請種別: ${record.request_type === "NEW" ? "登録依頼" : "修正依頼"}\n\nhttps://japansleevesystem.com/dashboard/eapp/customers/${record.id}`,
          })
        } catch (e) {
          console.error("承認依頼メール送信エラー:", e)
        }
      }
    }
  }

  return NextResponse.json(record)
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "管理者のみ削除できます" }, { status: 403 })
  }
  const { id } = await params
  await prisma.tokuiCreditRequestFile.deleteMany({ where: { request_id: id } })
  await prisma.tokuiCreditRequestApprovalStep.deleteMany({ where: { request_id: id } })
  await prisma.tokuiCreditRequest.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}