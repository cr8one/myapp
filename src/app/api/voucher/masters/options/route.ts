import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"

const CATEGORIES = ["doc_type", "media_type", "payment_method", "transfer_method"]

export async function GET(req: NextRequest) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const category = new URL(req.url).searchParams.get("category")
  const options = await prisma.mVoucherOption.findMany({
    where: category ? { category } : {},
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  })
  return NextResponse.json(options)
}

export async function POST(req: Request) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const { category, value, sort_order } = await req.json()
  const text = String(value ?? "").trim()
  if (!CATEGORIES.includes(category) || !text) {
    return NextResponse.json({ error: "種類または値が正しくありません" }, { status: 400 })
  }
  let order = sort_order
  if (typeof order !== "number") {
    const last = await prisma.mVoucherOption.findFirst({ where: { category }, orderBy: { sort_order: "desc" } })
    order = (last?.sort_order ?? 0) + 1
  }
  const option = await prisma.mVoucherOption.create({ data: { category, value: text, sort_order: order } })
  return NextResponse.json(option)
}
