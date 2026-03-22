import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      parts: true,
    },
  })

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(product)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { code, name, description, userId, parts } = body

  // 既存パーツを削除して再作成
  await prisma.part.deleteMany({ where: { productId: id } })

  const product = await prisma.product.update({
    where: { id },
    data: {
      code,
      name,
      description,
      userId,
      parts: {
        create: parts?.map((p: { code: string; name: string; note?: string }) => ({
          code: p.code,
          name: p.name,
          note: p.note,
        })) ?? [],
      },
    },
    include: {
      user: { select: { id: true, name: true } },
      parts: true,
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await prisma.part.deleteMany({ where: { productId: id } })
  await prisma.product.delete({ where: { id } })

  return NextResponse.json({ success: true })
}