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
  return NextResponse.json(record)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const before = await prisma.dxfRequest.findUnique({ where: { id } })
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
