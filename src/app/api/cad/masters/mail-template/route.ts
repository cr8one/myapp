import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  let template = await prisma.mCadMailTemplate.findFirst()
  if (!template) {
    template = await prisma.mCadMailTemplate.create({ data: { body: "" } })
  }
  return NextResponse.json(template)
}
export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { body } = await req.json()
  let template = await prisma.mCadMailTemplate.findFirst()
  if (!template) {
    template = await prisma.mCadMailTemplate.create({ data: { body: body ?? "" } })
  } else {
    template = await prisma.mCadMailTemplate.update({
      where: { id: template.id },
      data: { body: body ?? "" },
    })
  }
  return NextResponse.json(template)
}
