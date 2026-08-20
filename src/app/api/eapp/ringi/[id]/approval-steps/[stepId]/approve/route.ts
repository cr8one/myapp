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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, stepId } = await params
  const { send_mail, decision_result } = await req.json().catch(() => ({ send_mail: true }))

  const target = await prisma.ringiApprovalStep.findUnique({ where: { id: stepId } })
  if (!target || target.request_id !== id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!target.approver_email || target.approver_email !== session.user.email) {
    return NextResponse.json({ error: "このステップの承認者本人のみ承認できます" }, { status: 403 })
  }
  if (target.status === "承認済み") {
    return NextResponse.json({ error: "既に承認済みです" }, { status: 400 })
  }

  const stageSteps = await prisma.ringiApprovalStep.findMany({
    where: { request_id: id, stage: target.stage },
    orderBy: { step_order: "asc" },
  })

  // 自分より前の順序が全て承認済みでなければ承認不可（同じ順序内は順不同）
  const blockedByEarlier = stageSteps.some(s => s.step_order < target.step_order && s.status !== "承認済み")
  if (blockedByEarlier) {
    return NextResponse.json({ error: "前の順序の承認が完了していないため承認できません" }, { status: 400 })
  }

  await prisma.ringiApprovalStep.update({
    where: { id: stepId },
    data: { status: "承認済み", approved_at: new Date() },
  })

  const sameOrderRemaining = stageSteps.filter(s => s.id !== stepId && s.step_order === target.step_order && s.status !== "承認済み")
  const allRemaining = stageSteps.filter(s => s.id !== stepId && s.status !== "承認済み")
  const request = await prisma.ringiRequest.findUnique({ where: { id } })

  if (allRemaining.length === 0) {
    // このステージの全ステップ承認完了
    if (target.stage === "起案部") {
      await prisma.ringiRequest.update({ where: { id }, data: { status: "受付待ち" } })
    } else if (target.stage === "関連部役員社長") {
      await prisma.ringiRequest.update({
        where: { id },
        data: { status: "決裁済み", decision_date: new Date(), decision_result: decision_result ?? "可" },
      })
    }
  } else if (sameOrderRemaining.length === 0 && send_mail) {
    // 同じ順序の全員が承認完了 → 次の順序の承認者へまとめて通知
    const nextOrder = Math.min(...allRemaining.map(s => s.step_order))
    const nextSteps = allRemaining.filter(s => s.step_order === nextOrder)
    for (const nextStep of nextSteps) {
      if (!nextStep.approver_email) continue
      try {
        await transporter.sendMail({
          from: `Japan Sleeve <${process.env.SMTP_FROM}>`,
          to: nextStep.approver_email,
          subject: `【稟議書】承認依頼: ${request?.title ?? ""}`,
          text: `${nextStep.approver_name ?? ""} 様\n\n稟議書「${request?.title ?? ""}」の承認をお願いします。\n\nhttps://japansleevesystem.com/dashboard/eapp/ringi/${id}`,
        })
      } catch (e) {
        console.error("承認依頼メール送信エラー:", e)
      }
    }
  }

  const updated = await prisma.ringiApprovalStep.findMany({
    where: { request_id: id },
    orderBy: [{ stage: "asc" }, { step_order: "asc" }],
  })
  return NextResponse.json({ steps: updated, stageCompleted: allRemaining.length === 0 })
}