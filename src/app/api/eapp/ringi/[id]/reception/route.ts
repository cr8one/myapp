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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { reception_number, reception_date, send_mail } = await req.json()

  const request = await prisma.ringiRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (request.status !== "受付待ち") {
    return NextResponse.json({ error: "受付待ち状態の申請のみ受付処理できます" }, { status: 400 })
  }

  const commonSteps = await prisma.mApprovalRoute.findMany({
    where: { service_type: "ringi" },
    orderBy: { step_order: "asc" },
    include: {
      position: { select: { name: true } },
      approver: { select: { name: true, email: true } },
    },
  })

  const updated = await prisma.ringiRequest.update({
    where: { id },
    data: {
      reception_number: reception_number || null,
      reception_date: reception_date ? new Date(reception_date) : new Date(),
      status: commonSteps.length > 0 ? "関連部承認中" : "決裁済み",
    },
  })

  if (commonSteps.length > 0) {
    await prisma.ringiApprovalStep.createMany({
      data: commonSteps.map((s, idx) => ({
        request_id: id,
        stage: "関連部役員社長",
        step_order: idx + 1,
        position_name: s.position?.name ?? null,
        approver_name: s.approver?.name ?? null,
        approver_email: s.approver?.email ?? null,
      })),
    })
    if (send_mail !== false) {
      const first = commonSteps[0]
      if (first.approver?.email) {
        try {
          await transporter.sendMail({
            from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
            to: first.approver.email,
            subject: `【稟議書】承認依頼: ${updated.title}`,
            text: `${first.approver.name ?? ""} 様\n\n稟議書「${updated.title}」の承認をお願いします。\n\nhttps://japansleevesystem.com/dashboard/eapp/ringi/${id}`,
          })
        } catch (e) {
          console.error("承認依頼メール送信エラー:", e)
        }
      }
    }
  }

  return NextResponse.json(updated)
}
