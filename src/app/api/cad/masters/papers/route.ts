import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const papers = await prisma.mCadPaper.findMany({ orderBy: { sort_order: "asc" } })
  return NextResponse.json(papers)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, width, height, sort_order } = await req.json()
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
  const paper = await prisma.mCadPaper.create({
    data: { name, width: width || null, height: height || null, sort_order: sort_order ?? 0 },
  })
  return NextResponse.json(paper)
}
