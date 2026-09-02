import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import nodemailer from "nodemailer"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"

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
      approval_steps: { orderBy: { step_order: "asc" } },
    },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const approverEmails = record.approval_steps.map(s => s.approver_email).filter((e): e is string => !!e)
  const approverUsers = approverEmails.length > 0
    ? await prisma.user.findMany({ where: { email: { in: approverEmails } }, select: { email: true, inkanImageKey: true } })
    : []
  const inkanUrlByEmail: Record<string, string> = {}
  for (const u of approverUsers) {
    if (u.inkanImageKey) {
      inkanUrlByEmail[u.email] = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: u.inkanImageKey }), { expiresIn: 300 })
    }
  }
  const approval_steps_with_inkan = record.approval_steps.map(s => ({
    ...s,
    inkan_image_url: s.approver_email ? inkanUrlByEmail[s.approver_email] : undefined,
  }))
  return NextResponse.json({ ...record, approval_steps: approval_steps_with_inkan })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { send_mail, approval_steps, ...body } = await req.json()

  const before = await prisma.ringiRequest.findUnique({ where: { id } })

  const record = await prisma.ringiRequest.update({
    where: { id },
    data: body,
  })

  if (before?.status === "下書き" && record.status === "起案部承認中") {
    let steps: { step_order: number; position_name: string | null; approver_name: string | null; approver_email: string | null }[] = []

    if (Array.isArray(approval_steps) && approval_steps.length > 0) {
      const userIds: string[] = approval_steps.map((s: { approver_user_id?: string }) => s.approver_user_id).filter((v: string | undefined): v is string => !!v)
      const approvers = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
      steps = approval_steps.map((s: { step_order: number; position_name?: string; approver_user_id?: string }) => {
        const approver = approvers.find(a => a.id === s.approver_user_id)
        return {
          step_order: s.step_order,
          position_name: s.position_name || null,
          approver_name: approver?.name ?? null,
          approver_email: approver?.email ?? null,
        }
      })
    } else if (record.requester_user_id) {
      const userSteps = await prisma.userApproverSetting.findMany({
        where: { user_id: record.requester_user_id, service_type: "ringi" },
        orderBy: { step_order: "asc" },
        include: {
          position: { select: { name: true } },
          approver: { select: { name: true, email: true } },
        },
      })
      steps = userSteps.map(s => ({
        step_order: s.step_order,
        position_name: s.position?.name ?? null,
        approver_name: s.approver?.name ?? null,
        approver_email: s.approver?.email ?? null,
      }))
    }

    if (steps.length > 0) {
      await prisma.ringiApprovalStep.createMany({
        data: steps.map((s, idx) => ({
          request_id: record.id,
          stage: "起案部",
          step_order: s.step_order || idx + 1,
          position_name: s.position_name,
          approver_name: s.approver_name,
          approver_email: s.approver_email,
        })),
      })
      const firstOrder = Math.min(...steps.map(s => s.step_order || 1))
      const firstStepApprovers = steps.filter(s => (s.step_order || 1) === firstOrder)
      if (send_mail !== false) {
        for (const s of firstStepApprovers) {
          if (!s.approver_email) continue
          try {
            await transporter.sendMail({
              from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
              to: s.approver_email,
              subject: `【稟議書】承認依頼: ${record.title}`,
              text: `${s.approver_name ?? ""} 様\n\n稟議書「${record.title}」の承認をお願いします。\n\nhttps://japansleevesystem.com/dashboard/eapp/ringi/${record.id}`,
            })
          } catch (e) {
            console.error("承認依頼メール送信エラー:", e)
          }
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