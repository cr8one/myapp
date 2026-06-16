import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.addressBookChangeRequest.findUnique({
    where: { id },
    include: {
      address_book: true,
      requester: { select: { name: true, email: true } },
      items: true,
    },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const record = await prisma.addressBookChangeRequest.update({
    where: { id },
    data: { status: body.status },
    include: {
      address_book: true,
      requester: { select: { name: true, email: true } },
      items: true,
    },
  })
  return NextResponse.json(record)
}
