import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { createAuditLog } from "@/lib/audit"
import { calcWorkTime, lookupBaseMinutes } from "@/lib/cad/work-time"

const EDITABLE_STATUSES = ["依頼済", "着手", "保留"]

type Params = { params: Promise<{ id: string }> }

type WorkTimeRow = {
  standard_minutes: number | null
  has_mishin: boolean
  needs_prep: boolean
  extra_parts: number
  updated_by: string | null
  updated_at: Date
}

function toResponse(w: WorkTimeRow | null) {
  return {
    standard_minutes: w?.standard_minutes ?? null,
    has_mishin: w?.has_mishin ?? false,
    needs_prep: w?.needs_prep ?? false,
    extra_parts: w?.extra_parts ?? 0,
    updated_by: w?.updated_by ?? null,
    updated_at: w?.updated_at ?? null,
  }
}

function parseMinutes(raw: unknown): { ok: true; value: number | null } | { ok: false } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null }
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0 || n > 99999) return { ok: false }
  return { ok: true, value: n }
}

function parseExtraParts(raw: unknown): { ok: true; value: number } | { ok: false } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: 0 }
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0 || n > 99) return { ok: false }
  return { ok: true, value: n }
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const workTime = await prisma.cadWorkTime.findUnique({ where: { request_id: id } })
  return NextResponse.json(toResponse(workTime))
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const record = await prisma.cadRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!EDITABLE_STATUSES.includes(record.status)) {
    return NextResponse.json({ error: `${record.status}の依頼書では作業標準時間を変更できません` }, { status: 400 })
  }

  const existing = await prisma.cadWorkTime.findUnique({ where: { request_id: id } })
  const cur = toResponse(existing)

  let minutes = cur.standard_minutes
  if ("standard_minutes" in body) {
    const parsed = parseMinutes(body.standard_minutes)
    if (parsed.ok === false) {
      return NextResponse.json({ error: "作業標準時間は0以上の整数（分）で入力してください" }, { status: 400 })
    }
    minutes = parsed.value
  }

  let hasMishin = cur.has_mishin
  if (body.has_mishin !== undefined) {
    if (typeof body.has_mishin !== "boolean") {
      return NextResponse.json({ error: "ミシン罫の指定が正しくありません" }, { status: 400 })
    }
    hasMishin = body.has_mishin
  }

  let needsPrep = cur.needs_prep
  if (body.needs_prep !== undefined) {
    if (typeof body.needs_prep !== "boolean") {
      return NextResponse.json({ error: "前準備の指定が正しくありません" }, { status: 400 })
    }
    needsPrep = body.needs_prep
  }

  let extraParts = cur.extra_parts
  if (body.extra_parts !== undefined) {
    const parsed = parseExtraParts(body.extra_parts)
    if (parsed.ok === false) {
      return NextResponse.json({ error: "追加パーツ数は0以上99以下の整数で入力してください" }, { status: 400 })
    }
    extraParts = parsed.value
  }

  const changedFields: { field: string; label: string; before: string | number | null; after: string | number | null }[] = []
  if (cur.standard_minutes !== minutes) {
    changedFields.push({ field: "standard_minutes", label: "作業標準時間", before: cur.standard_minutes, after: minutes })
  }
  if (cur.has_mishin !== hasMishin) {
    changedFields.push({ field: "has_mishin", label: "ミシン罫", before: cur.has_mishin ? "有" : "無", after: hasMishin ? "有" : "無" })
  }
  if (cur.needs_prep !== needsPrep) {
    changedFields.push({ field: "needs_prep", label: "前準備（断裁・スミ切り未実施）", before: cur.needs_prep ? "要" : "不要", after: needsPrep ? "要" : "不要" })
  }
  if (cur.extra_parts !== extraParts) {
    changedFields.push({ field: "extra_parts", label: "追加パーツ数", before: cur.extra_parts, after: extraParts })
  }

  if (changedFields.length === 0) {
    return NextResponse.json(cur)
  }

  const updatedBy = session.user?.name || ""
  const saved = await prisma.cadWorkTime.upsert({
    where: { request_id: id },
    create: {
      request_id: id,
      standard_minutes: minutes,
      has_mishin: hasMishin,
      needs_prep: needsPrep,
      extra_parts: extraParts,
      updated_by: updatedBy,
    },
    update: {
      standard_minutes: minutes,
      has_mishin: hasMishin,
      needs_prep: needsPrep,
      extra_parts: extraParts,
      updated_by: updatedBy,
    },
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
      changedFields,
    },
  })

  return NextResponse.json(toResponse(saved))
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  const record = await prisma.cadRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const extra = parseExtraParts(body.extra_parts)
  if (extra.ok === false) {
    return NextResponse.json({ error: "追加パーツ数は0以上99以下の整数で入力してください" }, { status: 400 })
  }

  const base = await lookupBaseMinutes(record.hinmoku, record.content)
  const result = calcWorkTime({
    baseMinutes: base.minutes,
    finishCount: record.finish_count,
    hasMishin: body.has_mishin === true,
    needsPrep: body.needs_prep === true,
    extraParts: extra.value,
  })
  const warnings = base.warning ? [base.warning, ...result.warnings] : result.warnings

  return NextResponse.json({ ...result, warnings })
}