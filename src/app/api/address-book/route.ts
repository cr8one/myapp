import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50
  const offset = (page - 1) * limit
  const where: Record<string, unknown> = { flg_del: 0 }
  if (keyword) {
    where.OR = [
      { uid: { contains: keyword, mode: "insensitive" } },
      { company_name: { contains: keyword, mode: "insensitive" } },
      { company_name_kana: { contains: keyword, mode: "insensitive" } },
      { name: { contains: keyword, mode: "insensitive" } },
      { department: { contains: keyword, mode: "insensitive" } },
      { position: { contains: keyword, mode: "insensitive" } },
      { address1: { contains: keyword, mode: "insensitive" } },
      { address2: { contains: keyword, mode: "insensitive" } },
    ]
  }
  const [records, total] = await Promise.all([
    prisma.addressBook.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.addressBook.count({ where }),
  ])
  return NextResponse.json({ records, total })
}
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const last = await prisma.addressBook.findFirst({
    orderBy: { uid: "desc" },
    select: { uid: true },
  })
  const nextNum = last ? parseInt(last.uid) + 1 : 1
  const uid = String(nextNum).padStart(6, "0")
  const record = await prisma.addressBook.create({
    data: {
      uid,
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
