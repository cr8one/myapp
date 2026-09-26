import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import nodemailer from "nodemailer"
import { createAuditLog } from "@/lib/audit"
import { DXF_REQUEST_FIELD_LABELS } from "@/lib/cad/dxf-request-history"
import { dxfCompleteMailCategory } from "@/lib/cad/mail-categories"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { cc, subject, body } = await req.json()

  const record = await prisma.dxfRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (record.status !== "作業中") {
    return NextResponse.json({ error: "作業中のステータスでのみ完了にできます" }, { status: 400 })
  }

  const category = dxfCompleteMailCategory(record.purpose)
  const recipients = await prisma.mCadMailRecipient.findMany({ where: { category }, orderBy: { sort_order: "asc" } })
  const to = recipients.map(r => r.email)
  if (to.length === 0) {
    return NextResponse.json({ error: "送信先メールアドレスがマスタに登録されていません" }, { status: 400 })
  }

  try {
    await transporter.sendMail({
      from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
      to: to.join(","),
      cc: Array.isArray(cc) ? cc.join(",") : (cc || undefined),
      subject,
      text: body,
    })
    const updated = await prisma.dxfRequest.update({
      where: { id },
      data: { status: "完了", updated_at: new Date() },
    })
    await createAuditLog({
      userId: session.user?.id,
      service: "cad",
      action: "UPDATE",
      targetModel: "DxfRequest",
      targetId: id,
      targetLabel: record.uid,
      diff: {
        classification: "完了",
        changedFields: [{ field: "status", label: DXF_REQUEST_FIELD_LABELS.status, before: record.status ?? "", after: "完了" }],
      },
    })
    return NextResponse.json({ ok: true, record: updated })
  } catch (e) {
    console.error("DXF変換完了メール送信エラー:", e)
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 })
  }
}