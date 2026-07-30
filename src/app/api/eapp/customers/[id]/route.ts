import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.tokuiCreditRequest.findUnique({
    where: { id },
    include: { files: { orderBy: { uploaded_at: "desc" } } },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const record = await prisma.tokuiCreditRequest.update({
    where: { id },
    data: {
      ...body,
      requested_date: body.requested_date ? new Date(body.requested_date) : undefined,
    },
  })
  return NextResponse.json(record)
}
