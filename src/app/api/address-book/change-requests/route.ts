import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50
  const where: Record<string, unknown> = {}
  if (status) where.status = status
  const [records, total] = await Promise.all([
    prisma.addressBookChangeRequest.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        address_book: { select: { uid: true, company_name: true } },
        requester: { select: { name: true, email: true } },
        items: true,
      },
    }),
    prisma.addressBookChangeRequest.count({ where }),
  ])
  return NextResponse.json({ records, total })
}
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { address_book_id, items, remarks } = body
  // uid採番
  const last = await prisma.addressBookChangeRequest.findFirst({ orderBy: { uid: "desc" }, select: { uid: true } })
  const nextNum = last ? parseInt(last.uid) + 1 : 1
  const uid = String(nextNum).padStart(6, "0")
  const record = await prisma.addressBookChangeRequest.create({
    data: {
      uid,
      address_book_id,
      requester_id: session.user.id,
      status: "依頼中",
      remarks: remarks || null,
      items: {
        create: items.map((item: { field_name: string; field_label: string; before_value: string; after_value: string }) => ({
          field_name: item.field_name,
          field_label: item.field_label,
          before_value: item.before_value || null,
          after_value: item.after_value || null,
        })),
      },
    },
    include: {
      address_book: { select: { uid: true, company_name: true } },
      requester: { select: { name: true, email: true } },
      items: true,
    },
  })
  // 配信先ユーザー取得
  const targets = await prisma.userPermission.findMany({
    where: { addressBookChangeRequestTarget: true },
    include: { user: { select: { email: true, name: true } } },
  })
  const toEmails = targets.map(t => t.user.email).filter(Boolean)
  if (toEmails.length > 0) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    const addressBook = record.address_book
    const requesterName = record.requester?.name ?? record.requester?.email ?? "不明"
    const itemsText = record.items.map(i =>
      `【${i.field_label}】\n  変更前：${i.before_value ?? "—"}\n  変更後：${i.after_value ?? "—"}`
    ).join("\n\n")
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: toEmails.join(","),
      subject: `【住所録変更依頼】No.${uid} ${addressBook.company_name ?? ""}`,
      text: `住所録の変更依頼が届きました。\n\n依頼No：${uid}\n住所録No：${addressBook.uid}\n会社名：${addressBook.company_name ?? "—"}\n依頼者：${requesterName}\n備考：${remarks ?? "—"}\n\n【変更内容】\n\n${itemsText}\n\n管理画面から確認・対応をお願いします。`,
    })
  }
  return NextResponse.json(record)
}
