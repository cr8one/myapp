import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.addressBook.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const record = await prisma.addressBook.update({
    where: { id },
    data: {
      company_name: body.company_name || null,
      company_name_kana: body.company_name_kana || null,
      department: body.department || null,
      position: body.position || null,
      name: body.name || null,
      honorific: body.honorific || null,
      postal_code: body.postal_code || null,
      address1: body.address1 || null,
      address2: body.address2 || null,
      remarks: body.remarks || null,
    },
  })
  return NextResponse.json(record)
}
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await prisma.addressBook.update({ where: { id }, data: { flg_del: 1 } })
  return NextResponse.json({ ok: true })
}
