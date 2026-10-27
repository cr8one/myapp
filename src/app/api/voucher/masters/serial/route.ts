import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"

export async function GET() {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const config = await prisma.mVoucherSerial.findFirst()
  const max = await prisma.voucher.aggregate({ _max: { file_no: true } })
  return NextResponse.json({ next_value: config?.next_value ?? 1, max_used: max._max.file_no ?? 0 })
}

export async function PATCH(req: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  const { next_value } = await req.json()
  const value = Number(next_value)
  if (!Number.isInteger(value) || value < 1 || value > 999999) {
    return NextResponse.json({ error: "次の番号は1〜999999の整数で指定してください" }, { status: 400 })
  }
  const max = await prisma.voucher.aggregate({ _max: { file_no: true } })
  const used = max._max.file_no ?? 0
  if (value <= used) {
    return NextResponse.json({ error: "すでに使われている番号（" + used + "）より大きい値を指定してください" }, { status: 400 })
  }
  const config = await prisma.mVoucherSerial.findFirst()
  const updated = config
    ? await prisma.mVoucherSerial.update({ where: { id: config.id }, data: { next_value: value } })
    : await prisma.mVoucherSerial.create({ data: { next_value: value } })
  return NextResponse.json({ next_value: updated.next_value, max_used: used })
}
