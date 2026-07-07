import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const options = await prisma.mCadOption.findMany({
    where: category ? { category } : {},
    orderBy: { sort_order: "asc" },
  })
  return NextResponse.json(options)
}
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { category, value, sort_order } = await req.json()
  if (!category || !value) return NextResponse.json({ error: "category and value are required" }, { status: 400 })
  const option = await prisma.mCadOption.create({
    data: { category, value, sort_order: sort_order ?? 0 },
  })
  return NextResponse.json(option)
}
