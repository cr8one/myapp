import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { createAuditLog } from "@/lib/audit"
import { DXF_REQUEST_FIELD_LABELS } from "@/lib/cad/dxf-request-history"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  "依頼済み": ["作業中"],
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { status: nextStatus } = await req.json()

  const record = await prisma.dxfRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowed = ALLOWED_TRANSITIONS[record.status ?? ""] ?? []
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json({ error: `${record.status}から${nextStatus}への変更はできません` }, { status: 400 })
  }

  const updated = await prisma.dxfRequest.update({
    where: { id },
    data: { status: nextStatus, updated_at: new Date() },
  })

  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "UPDATE",
    targetModel: "DxfRequest",
    targetId: id,
    targetLabel: record.uid,
    diff: {
      classification: "着手",
      changedFields: [{ field: "status", label: DXF_REQUEST_FIELD_LABELS.status, before: record.status ?? "", after: nextStatus }],
    },
  })

  return NextResponse.json(updated)
}