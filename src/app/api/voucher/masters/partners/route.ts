import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"

const include = {
  staff: { select: { id: true, name: true } },
  media_option: { select: { id: true, value: true } },
  payment_option: { select: { id: true, value: true } },
  transfer_option: { select: { id: true, value: true } },
}

export async function GET(req: NextRequest) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const staffId = new URL(req.url).searchParams.get("staff_user_id")
  const partners = await prisma.mVoucherPartner.findMany({
    where: staffId ? { staff_user_id: staffId } : {},
    include,
    orderBy: [{ furigana: "asc" }, { name: "asc" }],
  })
  return NextResponse.json(partners)
}

export async function POST(req: Request) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const b = await req.json()
  const name = String(b.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "取引先名を入力してください" }, { status: 400 })
  const staffId = b.staff_user_id || null
  const dup = await prisma.mVoucherPartner.findFirst({ where: { name, staff_user_id: staffId } })
  if (dup) return NextResponse.json({ error: "同じ取引先名・担当の組み合わせがすでに登録されています" }, { status: 409 })
  const partner = await prisma.mVoucherPartner.create({
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
