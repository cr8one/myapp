import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category") || "cad_request"
  let template = await prisma.mCadMailTemplate.findFirst({ where: { category } })
  if (!template) {
    template = await prisma.mCadMailTemplate.create({ data: { body: "", category } })
  }
  return NextResponse.json(template)
}
export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { body, category } = await req.json()
  const cat = category || "cad_request"
  let template = await prisma.mCadMailTemplate.findFirst({ where: { category: cat } })
  if (!template) {
    template = await prisma.mCadMailTemplate.create({ data: { body: body ?? "", category: cat } })
  } else {
    template = await prisma.mCadMailTemplate.update({
      where: { id: template.id },
      data: { body: body ?? "" },
    })
  }
  return NextResponse.json(template)
}
