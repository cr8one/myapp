import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""
  const where: Record<string, unknown> = { flg_del: 0 }
  if (keyword) {
    where.OR = [
      { uid: { contains: keyword, mode: "insensitive" } },
      { title: { contains: keyword, mode: "insensitive" } },
      { client: { contains: keyword, mode: "insensitive" } },
      { hinmoku: { contains: keyword, mode: "insensitive" } },
      { hinban: { contains: keyword, mode: "insensitive" } },
    ]
  }
  const records = await prisma.cadRequest.findMany({
    where,
    orderBy: { uid: "desc" },
    take: 30,
    select: { uid: true, title: true, client: true, hinmoku: true, hinban: true },
  })
  const options = records.map(r => ({
    id: r.uid,
    label: r.uid,
    sublabel: [r.client, r.title || r.hinmoku, r.hinban].filter(Boolean).join(" / "),
  }))
  return NextResponse.json({ options })
}
