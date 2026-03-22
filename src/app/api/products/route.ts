import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const products = await prisma.product.findMany({
    include: { user: { select: { name: true } }, parts: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(products)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { code, name, description, parts } = body

  const product = await prisma.product.create({
    data: {
      code,
      name,
      description,
      userId: session.user?.id as string,
      parts: {
        create: parts?.map((p: { code: string; name: string; note?: string }) => ({
          code: p.code,
          name: p.name,
          note: p.note,
        })) ?? [],
      },
    },
    include: { parts: true },
  })

  return NextResponse.json(product)
}