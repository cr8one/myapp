import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { createAuditLog } from "@/lib/audit"

const EDITABLE_STATUSES = ["依頼済", "着手", "保留"]

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const workTime = await prisma.cadWorkTime.findUnique({ where: { request_id: id } })
  return NextResponse.json({
    standard_minutes: workTime?.standard_minutes ?? null,
    updated_by: workTime?.updated_by ?? null,
    updated_at: workTime?.updated_at ?? null,
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const record = await prisma.cadRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!EDITABLE_STATUSES.includes(record.status)) {
    return NextResponse.json({ error: `${record.status}の依頼書では作業標準時間を変更できません` }, { status: 400 })
  }

  const raw = body.standard_minutes
  let minutes: number | null = null
  if (raw !== null && raw !== undefined && raw !== "") {
    const n = Number(raw)
    if (!Number.isInteger(n) || n < 0 || n > 99999) {
      return NextResponse.json({ error: "作業標準時間は0以上の整数（分）で入力してください" }, { status: 400 })
    }
    minutes = n
  }

  const existing = await prisma.cadWorkTime.findUnique({ where: { request_id: id } })
  const before = existing?.standard_minutes ?? null
  if (before === minutes) {
    return NextResponse.json({ standard_minutes: minutes, updated_by: existing?.updated_by ?? null, updated_at: existing?.updated_at ?? null })
  }

  const updatedBy = session.user?.name || ""
  const saved = await prisma.cadWorkTime.upsert({
    where: { request_id: id },
    create: { request_id: id, standard_minutes: minutes, updated_by: updatedBy },
    update: { standard_minutes: minutes, updated_by: updatedBy },
  })

  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "UPDATE",
    targetModel: "CadRequest",
    targetId: id,
    targetLabel: record.uid,
    diff: {
      classification: "作業時間",
      changedFields: [{ field: "standard_minutes", label: "作業標準時間", before, after: minutes }],
    },
  })

  return NextResponse.json({
    standard_minutes: saved.standard_minutes,
    updated_by: saved.updated_by,
    updated_at: saved.updated_at,
  })
}