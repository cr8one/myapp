import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { diffDxfRequestFields } from "@/lib/cad/dxf-request-history"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.dxfRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  let linkedCad: { id: string; uid: string; hinban: string | null; hinmoku: string | null; title: string | null } | null = null
  if (record.id_cad) {
    linkedCad = await prisma.cadRequest.findUnique({
      where: { uid: record.id_cad },
      select: { id: true, uid: true, hinban: true, hinmoku: true, title: true },
    })
  }

  return NextResponse.json({ ...record, linkedCad })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const before = await prisma.dxfRequest.findUnique({ where: { id } })
  if (before?.status === "完了") {
    return NextResponse.json({ error: "完了済みの依頼書は編集できません" }, { status: 400 })
  }
  const record = await prisma.dxfRequest.update({
    where: { id },
    data: {
      id_cad: body.id_cad || null,
      request_date: body.request_date,
      request_time: body.request_time,
      desired_date: body.desired_date ? new Date(body.desired_date) : null,
      desired_time: body.desired_time || null,
      desired_time_kbn: body.desired_time_kbn ?? 0,
      purpose: body.purpose || null,
      remarks: body.remarks || null,
      daishi_desired_date: body.daishi_desired_date ? new Date(body.daishi_desired_date) : null,
      daishi_desired_time: body.daishi_desired_time || null,
      daishi_desired_time_kbn: body.daishi_desired_time_kbn ?? 0,
      daishi_remarks: body.daishi_remarks || null,
      worker: body.worker || null,
      status: body.status || null,
    },
  })

  if (before) {
    const changedFields = diffDxfRequestFields(before, record)
    if (changedFields.length > 0) {
      await createAuditLog({
        userId: session.user?.id,
        service: "cad",
        action: "UPDATE",
        targetModel: "DxfRequest",
        targetId: record.id,
        targetLabel: record.uid,
        diff: { classification: "編集", changedFields },
      })
    }
  }

  return NextResponse.json(record)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.dxfRequest.update({ where: { id }, data: { flg_del: 1 } })
  return NextResponse.json({ ok: true })
}
