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
  const sort = searchParams.get("sort") ?? "created_desc"
  const page = parseInt(searchParams.get("page") ?? "1")
  const PAGE_SIZE = 50

  const where = {
    ...(status ? { status } : {}),
    ...(keyword ? {
      OR: [
        { title: { contains: keyword } },
        { requester_names: { contains: keyword } },
        { reception_number: { contains: keyword } },
      ]
    } : {}),
  }

  const [total, records] = await Promise.all([
    prisma.ringiRequest.count({ where }),
    prisma.ringiRequest.findMany({
      where,
      orderBy: sort === "created_asc" ? { created_at: "asc" } : { created_at: "desc" },
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
  const { send_mail, ...requestBody } = body
  const sendMailOnCreate = send_mail !== false

  const record = await prisma.ringiRequest.create({
    data: {
      ...requestBody,
      status: requestBody.status ?? "起案部承認中",
    },
  })

  // 起案部承認ステップの生成：申請者の稟議書用承認者設定（service_type: "ringi"）から
  // 「申請する」時のみ生成（下書き保存では生成しない）
  if (requestBody.status === "起案部承認中" && requestBody.requester_user_id) {
    const userSteps = await prisma.userApproverSetting.findMany({
      where: { user_id: requestBody.requester_user_id, service_type: "ringi" },
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
      if (sendMailOnCreate && firstStep.approver?.email) {
        try {
          await transporter.sendMail({
            from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
            to: firstStep.approver.email,
            subject: `【稟議書】承認依頼: ${record.title}`,
            text: `${firstStep.approver.name ?? ""} 様\n\n稟議書「${record.title}」の承認をお願いします。\n\n起案者: ${record.requester_names}\n\n以下のURLから確認・承認してください。\nhttps://japansleevesystem.com/dashboard/eapp/ringi/${record.id}`,
          })
        } catch (e) {
          console.error("承認依頼メール送信エラー:", e)
        }
      }
    }
  }

  return NextResponse.json(record)
}
