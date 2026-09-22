import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = (searchParams.get("keyword") ?? "").trim()

  const parents = await prisma.dlmsDielineParent.findMany({
    where: {
      flg_del: 0,
      ...(keyword ? {
        OR: [
          { uid_ntemp: { contains: keyword } },
          { kyugataban: { contains: keyword } },
          { hinmoku: { contains: keyword } },
          { children: { some: { edaban: { contains: keyword }, flg_del: 0 } } },
        ],
      } : {}),
    },
    include: {
      children: { where: { flg_del: 0 }, orderBy: { edaban: "asc" } },
    },
    orderBy: { uid_ntemp: "desc" },
    take: 30,
  })

  const results: { value: string; sublabel: string }[] = []
  for (const p of parents) {
    const sublabel = [p.hinmoku, p.genre, p.kyugataban].filter(Boolean).join(" / ")
    if (p.children.length > 0) {
      for (const c of p.children) {
        results.push({ value: `${p.uid_ntemp}-${c.edaban}`, sublabel })
      }
    } else {
      results.push({ value: p.uid_ntemp, sublabel })
    }
  }

  return NextResponse.json(results.slice(0, 50))
}
