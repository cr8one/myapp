import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"

const include = {
  staff: { select: { id: true, name: true } },
  media_option: { select: { id: true, value: true } },
  payment_option: { select: { id: true, value: true } },
  transfer_option: { select: { id: true, value: true } },
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const { id } = await params
  const b = await req.json()
  const name = String(b.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "取引先名を入力してください" }, { status: 400 })
  const staffId = b.staff_user_id || null
  const dup = await prisma.mVoucherPartner.findFirst({ where: { name, staff_user_id: staffId, NOT: { id } } })
  if (dup) return NextResponse.json({ error: "同じ取引先名・担当の組み合わせがすでに登録されています" }, { status: 409 })
  const partner = await prisma.mVoucherPartner.update({
    where: { id },
    data: {
      name,
      furigana: b.furigana || null,
      staff_user_id: staffId,
      media_option_id: b.media_option_id || null,
      payment_option_id: b.payment_option_id || null,
      transfer_option_id: b.transfer_option_id || null,
      remarks: b.remarks || null,
    },
    include,
  })
  return NextResponse.json(partner)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const { id } = await params
  await prisma.mVoucherPartner.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
