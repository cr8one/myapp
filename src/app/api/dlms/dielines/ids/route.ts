import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const genre = searchParams.get("genre")
  const spec = searchParams.get("spec")
  const hinmoku = searchParams.get("hinmoku")
  const condition = searchParams.get("condition")
  const keyword = searchParams.get("keyword")
  const where = {
    flg_del: 0,
    ...(genre ? { genre } : {}),
    ...(spec ? { spec } : {}),
    ...(hinmoku ? { hinmoku } : {}),
    ...(condition ? { conditions: { some: { value: { contains: condition } } } } : {}),
    ...(keyword ? {
      OR: [
        { uid_ntemp: { contains: keyword } },
        { kyugataban: { contains: keyword } },
      ]
    } : {}),
  }
  const parents = await prisma.dlmsDielineParent.findMany({
    where,
    select: { id: true },
    orderBy: { uid_ntemp: "desc" },
  })
  return NextResponse.json({ ids: parents.map(p => p.id) })
}
