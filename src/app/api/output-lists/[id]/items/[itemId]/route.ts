import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { itemId } = await params
  const body = await req.json()
  const item = await prisma.outputListItem.update({
    where: { id: itemId },
    data: {
      company_name: body.company_name || null,
      company_name_kana: body.company_name_kana || null,
      postal_code: body.postal_code || null,
      address1: body.address1 || null,
      address2: body.address2 || null,
      department_in_charge: body.department_in_charge || null,
      department: body.department || null,
      position: body.position || null,
      name: body.name || null,
      honorific: body.honorific || null,
      remarks: body.remarks || null,
      sort_order: body.sort_order ?? undefined,
    },
  })
  return NextResponse.json(item)
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { itemId } = await params
  await prisma.outputListItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
