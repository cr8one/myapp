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
  const { notify_requester } = await req.json().catch(() => ({ notify_requester: false }))

  // システム担当者マスタに登録されているユーザーのみ操作可能
  const isSystemStaff = await prisma.mEappSystemStaff.findFirst({
    where: { user_id: session.user.id },
  })
  if (!isSystemStaff) {
    return NextResponse.json({ error: "システム担当者のみ操作できます" }, { status: 403 })
  }

  const record = await prisma.tokuiCreditRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (record.status !== "承認完了") {
    return NextResponse.json({ error: "承認完了の申請のみ登録済みにできます" }, { status: 400 })
  }

  const updated = await prisma.tokuiCreditRequest.update({
    where: { id },
    data: { status: "登録済み" },
  })

  if (notify_requester && record.requester_user_id) {
    const requester = await prisma.user.findUnique({ where: { id: record.requester_user_id } })
    if (requester?.email) {
      try {
        await transporter.sendMail({
          from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
          to: requester.email,
          subject: `【得意先申請】PRINSER登録完了: ${record.company_name ?? ""}（${record.uid}）`,
          text: `${requester.name ?? ""} 様\n\n得意先申請（${record.uid}）がPRINSERへ登録されました。\n\nhttps://japansleevesystem.com/dashboard/eapp/customers/${id}`,
        })
      } catch (e) {
        console.error("登録完了メール送信エラー:", e)
      }
    }
  }

  return NextResponse.json(updated)
}
