import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(request: Request) {
  const body = await request.json()
  const { supplyId, to, cc, subject, body: mailBody } = body

  try {
    await transporter.sendMail({
      from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      cc: Array.isArray(cc) ? cc.join(",") : cc,
      subject,
      text: mailBody,
    })

    // メール送信済みフラグを更新
    await prisma.sealSupply.update({
      where: { id: supplyId },
      data: { mailSentFlag: "済" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mail error:", error)
    return NextResponse.json({ error: "メール送信に失敗しました" }, { status: 500 })
  }
}
