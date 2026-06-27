import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const parts = await prisma.dppSchedulePart.findMany({
    where: { schedule_id: id, flg_del: 0 },
    orderBy: { sort_order: "asc" },
  })
  return NextResponse.json(parts)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const last = await prisma.dppSchedulePart.findFirst({
    where: { schedule_id: id, flg_del: 0 },
    orderBy: { sort_order: "desc" },
  })
  const nextOrder = last ? last.sort_order + 1 : 0
  const part = await prisma.dppSchedulePart.create({
    data: {
      schedule_id: id,
      sort_order: nextOrder,
      part_name: body.part_name || null,
      kosei_shu: body.kosei_shu || null,
      kosei_dankai: body.kosei_dankai || null,
      yoshi_name: body.yoshi_name || null,
      yoshi_renryo: body.yoshi_renryo || null,
      iro_omote: body.iro_omote || null,
      iro_ura: body.iro_ura || null,
      maisu: body.maisu || null,
      mentuke_daisuu: body.mentuke_daisuu ? parseInt(body.mentuke_daisuu) : null,
      page: body.page || null,
      nyuko_date: body.nyuko_date ? new Date(body.nyuko_date) : null,
      nyuko_time: body.nyuko_time || null,
      shiagari_date: body.shiagari_date ? new Date(body.shiagari_date) : null,
      shiagari_time: body.shiagari_time || null,
      biko: body.biko || null,
      biko_shiyosho: body.biko_shiyosho || null,
      flg_dgs: body.flg_dgs ? parseInt(body.flg_dgs) : 0,
      dgs_sensuu: body.dgs_sensuu || null,
      dgs_seikei_teishutsu: body.dgs_seikei_teishutsu ? parseInt(body.dgs_seikei_teishutsu) : null,
      dgs_kako_ari_teishutsu: body.dgs_kako_ari_teishutsu ? parseInt(body.dgs_kako_ari_teishutsu) : null,
      dgs_kako_nashi_teishutsu: body.dgs_kako_nashi_teishutsu ? parseInt(body.dgs_kako_nashi_teishutsu) : null,
      dgs_kako_ari_hikae: body.dgs_kako_ari_hikae ? parseInt(body.dgs_kako_ari_hikae) : null,
      dgs_kako_nashi_hikae: body.dgs_kako_nashi_hikae ? parseInt(body.dgs_kako_nashi_hikae) : null,
      dgs_kako_ari_sosuu: body.dgs_kako_ari_sosuu ? parseInt(body.dgs_kako_ari_sosuu) : null,
      dgs_kako_nashi_sosuu: body.dgs_kako_nashi_sosuu ? parseInt(body.dgs_kako_nashi_sosuu) : null,
      dgs_sosuu: body.dgs_sosuu ? parseInt(body.dgs_sosuu) : null,
      dgs_yohaku_ari_maisu: body.dgs_yohaku_ari_maisu ? parseInt(body.dgs_yohaku_ari_maisu) : null,
      dgs_taira_ari_maisu: body.dgs_taira_ari_maisu ? parseInt(body.dgs_taira_ari_maisu) : null,
      dgs_yohaku_nashi_maisu: body.dgs_yohaku_nashi_maisu ? parseInt(body.dgs_yohaku_nashi_maisu) : null,
      dgs_taira_nashi_maisu: body.dgs_taira_nashi_maisu ? parseInt(body.dgs_taira_nashi_maisu) : null,
      dgs_hikae_goukei: body.dgs_hikae_goukei ? parseInt(body.dgs_hikae_goukei) : null,
    },
  })
  return NextResponse.json(part)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const part = await prisma.dppSchedulePart.update({
    where: { id: body.id },
    data: {
      part_name: body.part_name || null,
      kosei_shu: body.kosei_shu || null,
      kosei_dankai: body.kosei_dankai || null,
      yoshi_name: body.yoshi_name || null,
      yoshi_renryo: body.yoshi_renryo || null,
      iro_omote: body.iro_omote || null,
      iro_ura: body.iro_ura || null,
      maisu: body.maisu || null,
      mentuke_daisuu: body.mentuke_daisuu ? parseInt(body.mentuke_daisuu) : null,
      page: body.page || null,
      nyuko_date: body.nyuko_date ? new Date(body.nyuko_date) : null,
      nyuko_time: body.nyuko_time || null,
      shiagari_date: body.shiagari_date ? new Date(body.shiagari_date) : null,
      shiagari_time: body.shiagari_time || null,
      biko: body.biko || null,
      biko_shiyosho: body.biko_shiyosho || null,
      flg_dgs: body.flg_dgs ? parseInt(body.flg_dgs) : 0,
      dgs_sensuu: body.dgs_sensuu || null,
      dgs_seikei_teishutsu: body.dgs_seikei_teishutsu ? parseInt(body.dgs_seikei_teishutsu) : null,
      dgs_kako_ari_teishutsu: body.dgs_kako_ari_teishutsu ? parseInt(body.dgs_kako_ari_teishutsu) : null,
      dgs_kako_nashi_teishutsu: body.dgs_kako_nashi_teishutsu ? parseInt(body.dgs_kako_nashi_teishutsu) : null,
      dgs_kako_ari_hikae: body.dgs_kako_ari_hikae ? parseInt(body.dgs_kako_ari_hikae) : null,
      dgs_kako_nashi_hikae: body.dgs_kako_nashi_hikae ? parseInt(body.dgs_kako_nashi_hikae) : null,
      dgs_kako_ari_sosuu: body.dgs_kako_ari_sosuu ? parseInt(body.dgs_kako_ari_sosuu) : null,
      dgs_kako_nashi_sosuu: body.dgs_kako_nashi_sosuu ? parseInt(body.dgs_kako_nashi_sosuu) : null,
      dgs_sosuu: body.dgs_sosuu ? parseInt(body.dgs_sosuu) : null,
      dgs_yohaku_ari_maisu: body.dgs_yohaku_ari_maisu ? parseInt(body.dgs_yohaku_ari_maisu) : null,
      dgs_taira_ari_maisu: body.dgs_taira_ari_maisu ? parseInt(body.dgs_taira_ari_maisu) : null,
      dgs_yohaku_nashi_maisu: body.dgs_yohaku_nashi_maisu ? parseInt(body.dgs_yohaku_nashi_maisu) : null,
      dgs_taira_nashi_maisu: body.dgs_taira_nashi_maisu ? parseInt(body.dgs_taira_nashi_maisu) : null,
      dgs_hikae_goukei: body.dgs_hikae_goukei ? parseInt(body.dgs_hikae_goukei) : null,
    },
  })
  return NextResponse.json(part)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await req.json()
  await prisma.dppSchedulePart.update({
    where: { id },
    data: { flg_del: 1 },
  })
  return NextResponse.json({ ok: true })
}
