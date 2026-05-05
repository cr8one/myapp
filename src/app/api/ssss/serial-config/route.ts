import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const config = await prisma.sealSerialConfig.findFirst()
  return NextResponse.json(config)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }
  const body = await request.json()
  const config = await prisma.sealSerialConfig.findFirst()
  if (!config) return NextResponse.json({ error: "設定が見つかりません" }, { status: 404 })

  const updated = await prisma.sealSerialConfig.update({
    where: { id: config.id },
    data: {
      nextValue: body.nextValue,
      increment: body.increment,
      prefix: body.prefix ?? null,
    },
  })
  return NextResponse.json(updated)
}
