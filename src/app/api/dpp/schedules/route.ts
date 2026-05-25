import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const progress = searchParams.get("progress")

  const records = await prisma.dppSchedule.findMany({
    where: {
      flg_del: 0,
      ...(progress ? { progress } : {}),
      ...(keyword ? {
        OR: [
          { hinban: { contains: keyword } },
          { hinmei: { contains: keyword } },
          { artist_name: { contains: keyword } },
          { eigyo_tanto: { contains: keyword } },
          { seihan_tanto: { contains: keyword } },
          { biko: { contains: keyword } },
        ],
      } : {}),
    },
    orderBy: [
      { nouki_date: "asc" },
      { nouki_time: "asc" },
      { created_at: "desc" },
    ],
  })
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // 採番
  const last = await prisma.dppSchedule.findFirst({
    orderBy: { schedule_no: "desc" },
  })
  const nextNo = last
    ? String(parseInt(last.schedule_no) + 1).padStart(5, "0")
    : "00001"

  const record = await prisma.dppSchedule.create({
    data: {
      schedule_no: nextNo,
      hinban: body.hinban || null,
      hinmei: body.hinmei || null,
      artist_name: body.artist_name || null,
      kosei_stage: body.kosei_stage || null,
      nouki_date: body.nouki_date ? new Date(body.nouki_date) : null,
      nouki_time: body.nouki_time || null,
      progress: body.progress || "入稿待ち",
      eigyo_tanto: body.eigyo_tanto || null,
      seihan_tanto: body.seihan_tanto || null,
      biko: body.biko || null,
      shuukei_daisuu: body.shuukei_daisuu ? parseFloat(body.shuukei_daisuu) : null,
    },
  })
  return NextResponse.json(record)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const record = await prisma.dppSchedule.update({
    where: { id: body.id },
    data: {
      hinban: body.hinban || null,
      hinmei: body.hinmei || null,
      artist_name: body.artist_name || null,
      kosei_stage: body.kosei_stage || null,
      nouki_date: body.nouki_date ? new Date(body.nouki_date) : null,
      nouki_time: body.nouki_time || null,
      progress: body.progress || null,
      eigyo_tanto: body.eigyo_tanto || null,
      seihan_tanto: body.seihan_tanto || null,
      biko: body.biko || null,
      shuukei_daisuu: body.shuukei_daisuu ? parseFloat(body.shuukei_daisuu) : null,
    },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await prisma.dppSchedule.update({
    where: { id },
    data: { flg_del: 1 },
  })
  return NextResponse.json({ ok: true })
}
