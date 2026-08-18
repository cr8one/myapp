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
  const record = await prisma.ringiRequest.findUnique({
    where: { id },
    include: {
      files: { orderBy: { uploaded_at: "desc" } },
      approval_steps: { orderBy: [{ stage: "asc" }, { step_order: "asc" }] },
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

  const before = await prisma.ringiRequest.findUnique({ where: { id } })

  const record = await prisma.ringiRequest.update({
    where: { id },
    data: body,
  })

  // 下書き→起案部承認中への初回遷移時のみ、起案部の承認ステップを生成
  if (before?.status === "下書き" && record.status === "起案部承認中" && record.requester_user_id) {
    const userSteps = await prisma.userApproverSetting.findMany({
      where: { user_id: record.requester_user_id, service_type: "ringi" },
      orderBy: { step_order: "asc" },
      include: {
        position: { select: { name: true } },
        approver: { select: { name: true, email: true } },
      },
    })
    if (userSteps.length > 0) {
      await prisma.ringiApprovalStep.createMany({
        data: userSteps.map((s, idx) => ({
          request_id: record.id,
          stage: "起案部",
          step_order: idx + 1,
          position_name: s.position?.name ?? null,
          approver_name: s.approver?.name ?? null,
          approver_email: s.approver?.email ?? null,
        })),
      })
      const firstStep = userSteps[0]
      if (send_mail !== false && firstStep.approver?.email) {
        try {
          await transporter.sendMail({
            from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
            to: firstStep.approver.email,
            subject: `【稟議書】承認依頼: ${record.title}`,
            text: `${firstStep.approver.name ?? ""} 様\n\n稟議書「${record.title}」の承認をお願いします。\n\nhttps://japansleevesystem.com/dashboard/eapp/ringi/${record.id}`,
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
  await prisma.ringiFile.deleteMany({ where: { request_id: id } })
  await prisma.ringiApprovalStep.deleteMany({ where: { request_id: id } })
  await prisma.ringiRequest.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
