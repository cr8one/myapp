import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPcViewer, pcVisibilityWhere } from "@/lib/pc-takeout-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { buildPcApprovalSteps, findWaitingPcIds } from "@/lib/pc-takeout-approval"
import { parsePcTakeout } from "@/lib/pc-takeout-input"
import { sendPcApprovalRequestMail } from "@/lib/pc-takeout-mail"
import { PC_STATUS_DRAFT, PC_STATUS_CONFIRMING, PC_STATUS_ISMS, PC_ROLE_CONFIRMER } from "@/lib/pc-takeout"

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  const viewer = await getPcViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sp = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(sp.get("page") ?? "1") || 1)

  // 画面からの絞り込み条件。見える範囲の判定（pcVisibilityWhere）に重ねるだけで、広げることはできない
  const filter: Record<string, any> = {}
  if (sp.get("status")) filter.status = sp.get("status")!
  if (sp.get("mine") === "1") filter.requester_id = viewer.userId
  // 自分の承認待ち：自分のステップが未承認で、申請が承認中で、前の順序がすべて承認済み（今、自分の番）
  if (sp.get("waiting") === "1") {
    filter.id = { in: await findWaitingPcIds(viewer.userId) }
  }
  const keyword = sp.get("keyword")
  if (keyword) {
    filter.OR = [
      { department_name: { contains: keyword } },
      { requester_name: { contains: keyword } },
      { device_name: { contains: keyword } },
    ]
  }
  const dateFrom = sp.get("date_from")
  const dateTo = sp.get("date_to")
  if (dateFrom || dateTo) {
    filter.request_date = {
      ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T00:00:00.000Z`) } : {}),
    }
  }

  const where = { AND: [pcVisibilityWhere(viewer), filter] }

  const [total, records] = await Promise.all([
    prisma.pcTakeoutRequest.count({ where }),
    prisma.pcTakeoutRequest.findMany({
      where,
      orderBy: { request_no: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        request_no: true,
        status: true,
        request_date: true,
        requester_id: true,
        requester_name: true,
        department_name: true,
        device_name: true,
        period_start: true,
        period_end: true,
        submitted_at: true,
        completed_at: true,
        approval_steps: {
          orderBy: { step_order: "asc" },
          select: { id: true, role: true, step_order: true, approver_name: true, status: true, approved_at: true },
        },
      },
    }),
  ])
  return NextResponse.json({ records, total, page_size: PAGE_SIZE })
}

// 作成：下書きの保存と、申請（submit: true）を兼ねる。メールは、send_mail: true のときだけ送る
export async function POST(req: NextRequest) {
  const viewer = await getPcViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const b = await req.json()
  const submit = b.submit === true
  const sendMail = b.send_mail === true

  const parsed = parsePcTakeout(b, submit)
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const v = parsed.value

  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // 所属部署が空のときは、ユーザーマスタの値で補う
  const departmentName = v.department_name || info.departmentName || null

  // 申請のときだけ、承認ステップを作る
  let steps: Awaited<ReturnType<typeof buildPcApprovalSteps>>["steps"] = []
  if (submit) {
    const built = await buildPcApprovalSteps(viewer.userId)
    if (built.error) return NextResponse.json({ error: built.error }, { status: 400 })
    steps = built.steps
  }
  const status = !submit
    ? PC_STATUS_DRAFT
    : steps.some(s => s.role === PC_ROLE_CONFIRMER) ? PC_STATUS_CONFIRMING : PC_STATUS_ISMS

  const record = await prisma.pcTakeoutRequest.create({
    data: {
      status,
      request_date: v.request_date,
      requester_id: viewer.userId,
      requester_name: info.name,
      department_name: departmentName,
      reason: v.reason,
      period_start: v.period_start,
      period_end: v.period_end,
      device_id: v.device_id,
      device_name: v.device_name,
      model_label: v.model_label,
      accessories: v.accessories,
      software: v.software,
      submitted_at: submit ? new Date() : null,
      approval_steps: submit ? { create: steps } : undefined,
      histories: submit ? { create: { action: "申請", actor_id: viewer.userId, actor_name: info.name } } : undefined,
    },
    select: { id: true, request_no: true, status: true },
  })
  if (submit && sendMail) await sendPcApprovalRequestMail(record.id)
  return NextResponse.json(record)
}
