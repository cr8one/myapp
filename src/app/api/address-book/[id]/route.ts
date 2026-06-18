import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const record = await prisma.addressBook.findUnique({
    where: { id },
    include: { contacts: { orderBy: { sort_order: "asc" } } },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  // 担当者の全削除→再作成
  if (body.contacts !== undefined) {
    await prisma.addressBookContact.deleteMany({ where: { address_book_id: id } })
  }
  const record = await prisma.addressBook.update({
    where: { id },
    data: {
      company_name: body.company_name || null,
      company_name_kana: body.company_name_kana || null,
      postal_code: body.postal_code || null,
      address1: body.address1 || null,
      address2: body.address2 || null,
      department_in_charge: body.department_in_charge || null,
      remarks: body.remarks || null,
      contacts: body.contacts !== undefined ? {
        create: body.contacts.map((c: { department?: string; position?: string; name?: string; honorific?: string }, i: number) => ({
          department: c.department || null,
          position: c.position || null,
          name: c.name || null,
          honorific: c.honorific || null,
          sort_order: i,
        })),
      } : undefined,
    },
    include: { contacts: { orderBy: { sort_order: "asc" } } },
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
