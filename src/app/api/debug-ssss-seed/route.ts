import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const existing = await prisma.sealSerialConfig.findFirst()
  if (existing) return NextResponse.json({ message: "already exists", config: existing })

  const config = await prisma.sealSerialConfig.create({
    data: { nextValue: 3201, increment: 1 },
  })
  return NextResponse.json({ message: "created", config })
}
