import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 50
  const [records, total] = await Promise.all([
    prisma.outputList.findMany({
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { _count: { select: { items: true } } },
    }),
    prisma.outputList.count(),
  ])
  return NextResponse.json({ records, total })
}
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const last = await prisma.outputList.findFirst({ orderBy: { uid: "desc" }, select: { uid: true } })
  const nextNum = last ? parseInt(last.uid) + 1 : 1
  const uid = String(nextNum).padStart(6, "0")
  const record = await prisma.outputList.create({
    data: {
      uid,
      name: body.name,
      remarks: body.remarks || null,
      items: {
        create: body.items.map((item: {
          sort_order: number
          company_name?: string; company_name_kana?: string
          postal_code?: string; address1?: string; address2?: string
          department_in_charge?: string; department?: string
          position?: string; name?: string; honorific?: string; remarks?: string
        }) => ({
          sort_order: item.sort_order,
          company_name: item.company_name || null,
          company_name_kana: item.company_name_kana || null,
          postal_code: item.postal_code || null,
          address1: item.address1 || null,
          address2: item.address2 || null,
          department_in_charge: item.department_in_charge || null,
          department: item.department || null,
          position: item.position || null,
          name: item.name || null,
          honorific: item.honorific || null,
          remarks: item.remarks || null,
        })),
      },
    },
    include: { items: { orderBy: { sort_order: "asc" } } },
  })
  return NextResponse.json(record)
}
