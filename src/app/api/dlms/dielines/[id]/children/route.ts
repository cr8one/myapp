import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // 枝番採番：同じ親の最大枝番+1
  const last = await prisma.dlmsDielineChild.findFirst({
    where: { parentId: id },
    orderBy: { edaban: "desc" },
  })
  const nextEdaban = last ? String(parseInt(last.edaban) + 1).padStart(2, "0") : "01"

  const child = await prisma.dlmsDielineChild.create({
    data: { ...body, parentId: id, edaban: nextEdaban },
  })
  return NextResponse.json(child)
}
