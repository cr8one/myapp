import { NextResponse } from "next/server"
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { cc, subject, body } = await req.json()

  const record = await prisma.cadRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (record.status !== "作成中") {
    return NextResponse.json({ error: "作成中のステータスでのみ依頼できます" }, { status: 400 })
  }

  // サーバー側必須項目チェック
  const errors: string[] = []
  if (!record.requester_name) errors.push("依頼営業名")
  if (!record.title) errors.push("タイトル")
  if (!record.content) errors.push("依頼内容")
  if (!record.paper) errors.push("用紙")
  if (record.finish_count == null) errors.push("仕上個数")
  if (!record.desired_date) errors.push("希望納期日")
  if (errors.length > 0) {
    return NextResponse.json({ error: `以下の項目が未入力です: ${errors.join("、")}` }, { status: 400 })
  }
  if (record.desired_date) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const desired = new Date(record.desired_date); desired.setHours(0, 0, 0, 0)
    if (desired < today) {
      return NextResponse.json({ error: "希望納期日が本日より前になっています" }, { status: 400 })
    }
  }

  const recipients = await prisma.mCadMailRecipient.findMany({ orderBy: { sort_order: "asc" } })
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
    const updated = await prisma.cadRequest.update({
      where: { id },
      data: { status: "依頼済", updated_at: new Date() },
    })
    return NextResponse.json({ ok: true, record: updated })
  } catch (e) {
    console.error("CAD依頼メール送信エラー:", e)
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 })
  }
}
