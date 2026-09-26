import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || "cad_request"
  const recipients = await prisma.mCadMailRecipient.findMany({ where: { category }, orderBy: { sort_order: "asc" } })
  return NextResponse.json(recipients)
}
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { email, sort_order, category } = await req.json()
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })
  const recipient = await prisma.mCadMailRecipient.create({
    data: { email, sort_order: sort_order ?? 0, category: category || "cad_request" },
  })
  return NextResponse.json(recipient)
}
