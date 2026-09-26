import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import nodemailer from "nodemailer"
import { createAuditLog } from "@/lib/audit"
import { DXF_REQUEST_FIELD_LABELS } from "@/lib/cad/dxf-request-history"
import { dxfRequestMailCategory } from "@/lib/cad/mail-categories"

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
  if (record.status !== "作成中") {
    return NextResponse.json({ error: "作成中のステータスでのみ依頼できます" }, { status: 400 })
  }

  const errors: string[] = []
  if (!record.id_cad) errors.push("CAD依頼書No")
  if (!record.purpose) errors.push("目的")
  if (!record.desired_date) errors.push("希望納期日")
  if (errors.length > 0) {
    return NextResponse.json({ error: `以下の項目が未入力です: ${errors.join("、")}` }, { status: 400 })
  }

  const category = dxfRequestMailCategory(record.purpose)
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
      data: { status: "依頼済み", updated_at: new Date() },
    })
    await createAuditLog({
      userId: session.user?.id,
      service: "cad",
      action: "UPDATE",
      targetModel: "DxfRequest",
      targetId: id,
      targetLabel: record.uid,
      diff: {
        classification: "依頼",
        changedFields: [{ field: "status", label: DXF_REQUEST_FIELD_LABELS.status, before: record.status ?? "", after: "依頼済み" }],
      },
    })
    return NextResponse.json({ ok: true, record: updated })
  } catch (e) {
    console.error("DXF変換依頼メール送信エラー:", e)
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 })
  }
}