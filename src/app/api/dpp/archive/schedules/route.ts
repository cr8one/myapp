import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
const PAGE_SIZE = 50
function buildWhere(searchParams: URLSearchParams) {
  const keyword = searchParams.get("keyword")
  const progress = searchParams.get("progress")
  const hinban = searchParams.get("hinban")
  const hinmei = searchParams.get("hinmei")
  const artistName = searchParams.get("artistName")
  const koseiStage = searchParams.get("koseiStage")
  const noukiFrom = searchParams.get("noukiFrom")
  const noukiTo = searchParams.get("noukiTo")
  const eigyoTanto = searchParams.get("eigyoTanto")
  const seihanTanto = searchParams.get("seihanTanto")
  const partName = searchParams.get("partName")
  const paperName = searchParams.get("paperName")
  const colorOmote = searchParams.get("colorOmote")
  const colorUra = searchParams.get("colorUra")
  const koseiType = searchParams.get("koseiType")
  const bikoSiyou = searchParams.get("bikoSiyou")
  const partBiko = searchParams.get("partBiko")
  const dgs = searchParams.get("dgs") // "1" | "0" | null(絞り込みなし)
  const partConditions: any[] = []
  if (partName) partConditions.push({ part_name: { contains: partName } })
  if (paperName) partConditions.push({ paper_name: { contains: paperName } })
  if (colorOmote) partConditions.push({ color_omote: { contains: colorOmote } })
  if (colorUra) partConditions.push({ color_ura: { contains: colorUra } })
  if (koseiType) partConditions.push({ kosei_type: { contains: koseiType } })
  if (bikoSiyou) partConditions.push({ biko_siyou: { contains: bikoSiyou } })
  if (partBiko) partConditions.push({ biko: { contains: partBiko } })
  if (dgs === "1" || dgs === "0") partConditions.push({ flg_dgs: dgs })
  const nouki: any = {}
  if (noukiFrom) nouki.gte = new Date(noukiFrom)
  if (noukiTo) {
    const to = new Date(noukiTo)
    to.setHours(23, 59, 59, 999)
    nouki.lte = to
  }
  return {
    ...(progress ? { progress } : {}),
    ...(hinban ? { hinban: { contains: hinban } } : {}),
    ...(hinmei ? { hinmei: { contains: hinmei } } : {}),
    ...(artistName ? { artist_name: { contains: artistName } } : {}),
    ...(koseiStage ? { kosei_stage: { contains: koseiStage } } : {}),
    ...(eigyoTanto ? { eigyo_tanto: { contains: eigyoTanto } } : {}),
    ...(seihanTanto ? { seihan_tanto: { contains: seihanTanto } } : {}),
    ...(Object.keys(nouki).length > 0 ? { nouki_date: nouki } : {}),
    ...(partConditions.length > 0 ? { parts: { some: { AND: partConditions } } } : {}),
    ...(keyword ? {
      OR: [
        { sc_id: { contains: keyword } },
        { hinban: { contains: keyword } },
        { hinmei: { contains: keyword } },
        { artist_name: { contains: keyword } },
        { eigyo_tanto: { contains: keyword } },
        { seihan_tanto: { contains: keyword } },
        { biko: { contains: keyword } },
      ],
    } : {}),
  }
}
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const where = buildWhere(searchParams)
  const page = parseInt(searchParams.get("page") ?? "1")
  const [total, records] = await Promise.all([
    prisma.dppScheduleArchive.count({ where }),
    prisma.dppScheduleArchive.findMany({
      where,
      orderBy: [
        { nouki_date: { sort: "desc", nulls: "last" } },
        { nouki_time: "desc" },
        { sc_id: "desc" },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])
  return NextResponse.json({ records, total })
}
