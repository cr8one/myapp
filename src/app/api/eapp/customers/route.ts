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

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const status = searchParams.get("status")
  const requestType = searchParams.get("requestType")
  const sort = searchParams.get("sort") ?? "uid_desc"
  const page = parseInt(searchParams.get("page") ?? "1")
  const PAGE_SIZE = 50

  const where = {
    ...(status ? { status } : {}),
    ...(requestType ? { request_type: requestType } : {}),
    ...(keyword ? {
      OR: [
        { uid: { contains: keyword } },
        { company_name: { contains: keyword } },
        { sales_rep_name: { contains: keyword } },
      ]
    } : {}),
  }

  const [total, records] = await Promise.all([
    prisma.tokuiCreditRequest.count({ where }),
    prisma.tokuiCreditRequest.findMany({
      where,
      orderBy: sort === "uid_asc" ? { uid: "asc" } : { uid: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  return NextResponse.json({ records, total })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // uid採番：TK10001から
  const last = await prisma.tokuiCreditRequest.findFirst({
    orderBy: { uid: "desc" },
  })
  const nextNum = last
    ? String(parseInt(last.uid.replace("TK", "")) + 1).padStart(5, "0")
    : "10001"

  const record = await prisma.tokuiCreditRequest.create({
    data: {
      ...body,
      uid: `TK${nextNum}`,
      requested_date: body.requested_date ? new Date(body.requested_date) : null,
    },
  })

  // 承認ルートのスナップショット生成：①申請者の承認者設定 → ②得意先共通承認者設定 の順
  if (body.requester_user_id) {
    const userSteps = await prisma.userApproverSetting.findMany({
      where: { user_id: body.requester_user_id },
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
      if (firstStep.approver?.email) {
        try {
          await transporter.sendMail({
            from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
            to: firstStep.approver.email,
            subject: `【得意先申請】承認依頼: ${record.company_name ?? ""}（${record.uid}）`,
            text: `${firstStep.approver.name ?? ""} 様\n\n得意先申請（${record.uid}）の承認をお願いします。\n\n会社名: ${record.company_name ?? ""}\n申請種別: ${record.request_type === "NEW" ? "登録依頼" : "修正依頼"}\n\n以下のURLから確認・承認してください。\nhttps://japansleevesystem.com/dashboard/eapp/customers/${record.id}`,
          })
        } catch (e) {
          console.error("承認依頼メール送信エラー:", e)
        }
      }
    }
  }

  return NextResponse.json(record)
}
