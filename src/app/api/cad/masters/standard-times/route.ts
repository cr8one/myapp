import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

function parseMinutes(raw: unknown): { ok: true; value: number | null } | { ok: false } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null }
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0 || n > 99999) return { ok: false }
  return { ok: true, value: n }
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const options = await prisma.mCadOption.findMany({
    where: { category: "hinmoku" },
    orderBy: { sort_order: "asc" },
    include: { standard_time: true },
  })

  return NextResponse.json(
    options.map(o => ({
      option_id: o.id,
      name: o.value,
      min_kosei: o.standard_time?.min_kosei ?? null,
      min_yugata: o.standard_time?.min_yugata ?? null,
      min_shinki: o.standard_time?.min_shinki ?? null,
      note: o.standard_time?.note ?? null,
    }))
  )
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const optionId = body.option_id
  if (typeof optionId !== "string" || optionId === "") {
    return NextResponse.json({ error: "option_id is required" }, { status: 400 })
  }

  const option = await prisma.mCadOption.findUnique({ where: { id: optionId } })
  if (!option || option.category !== "hinmoku") {
    return NextResponse.json({ error: "品目名の候補が見つかりません" }, { status: 404 })
  }

  const kosei = parseMinutes(body.min_kosei)
  const yugata = parseMinutes(body.min_yugata)
  const shinki = parseMinutes(body.min_shinki)
  if (!kosei.ok || !yugata.ok || !shinki.ok) {
    return NextResponse.json({ error: "標準時間は0以上の整数（分）で入力してください" }, { status: 400 })
  }

  const note = typeof body.note === "string" && body.note.trim() !== "" ? body.note.trim() : null

  const saved = await prisma.mCadStandardTime.upsert({
    where: { option_id: optionId },
    create: {
      option_id: optionId,
      min_kosei: kosei.value,
      min_yugata: yugata.value,
      min_shinki: shinki.value,
      note,
    },
    update: {
      min_kosei: kosei.value,
      min_yugata: yugata.value,
      min_shinki: shinki.value,
      note,
    },
  })

  return NextResponse.json({
    option_id: saved.option_id,
    name: option.value,
    min_kosei: saved.min_kosei,
    min_yugata: saved.min_yugata,
    min_shinki: saved.min_shinki,
    note: saved.note,
  })
}