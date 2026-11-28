import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logDevCreate } from "@/lib/dev-history"

export async function GET() {
  const years = await prisma.devTargetYearMaster.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(years)
}

export async function POST(req: Request) {
  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "年度名は必須です" }, { status: 400 })
  const exists = await prisma.devTargetYearMaster.findUnique({ where: { name } })
  if (exists) return NextResponse.json({ error: "同じ名前の年度がすでに登録されています" }, { status: 400 })
  const year = await prisma.devTargetYearMaster.create({ data: { name } })
  const session = await auth()
  await logDevCreate({ userId: session?.user?.id, targetModel: "DevTargetYearMaster", targetId: year.id, targetLabel: year.name })
  return NextResponse.json(year)
}
