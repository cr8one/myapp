import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()

  // edabanが指定されていなければ自動採番
  let edaban = body.edaban
  if (!edaban) {
    const last = await prisma.dlmsDielineChild.findFirst({
      where: { parentId: id },
      orderBy: { edaban: "desc" },
    })
    edaban = last ? String(parseInt(last.edaban) + 1).padStart(2, "0") : "01"
  } else {
    edaban = String(parseInt(edaban)).padStart(2, "0")
  }

  const { edaban: _, ...rest } = body
  const child = await prisma.dlmsDielineChild.create({
    data: { ...rest, parentId: id, edaban },
  })
  return NextResponse.json(child)
}
