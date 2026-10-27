import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const { id } = await params
  const { value, sort_order } = await req.json()
  const text = String(value ?? "").trim()
  if (!text) return NextResponse.json({ error: "値を入力してください" }, { status: 400 })
  const option = await prisma.mVoucherOption.update({
    where: { id },
    data: { value: text, ...(typeof sort_order === "number" && { sort_order }) },
  })
  return NextResponse.json(option)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const { id } = await params
  await prisma.mVoucherOption.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
