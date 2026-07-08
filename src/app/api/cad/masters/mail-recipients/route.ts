import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const recipients = await prisma.mCadMailRecipient.findMany({ orderBy: { sort_order: "asc" } })
  return NextResponse.json(recipients)
}
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { email, sort_order } = await req.json()
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })
  const recipient = await prisma.mCadMailRecipient.create({
    data: { email, sort_order: sort_order ?? 0 },
  })
  return NextResponse.json(recipient)
}
