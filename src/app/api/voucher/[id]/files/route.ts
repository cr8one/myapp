import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { isVoucherKey, fileExtension, ALLOWED_EXTENSIONS } from "@/lib/voucher-storage"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { file_key, file_name } = await req.json()
  const name = String(file_name ?? "")
  if (!isVoucherKey(file_key) || !ALLOWED_EXTENSIONS.includes(fileExtension(name))) {
    return NextResponse.json({ error: "ファイルが正しくありません" }, { status: 400 })
  }
  const voucher = await prisma.voucher.findUnique({ where: { id } })
  if (!voucher || voucher.deleted_flg) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const file = await prisma.$transaction(async (tx) => {
    const created = await tx.voucherFile.create({
      data: { voucher_id: id, file_key, file_name: name, file_type: fileExtension(name) },
    })
    await tx.voucherHistory.create({
      data: { voucher_id: id, kind: "変更", field_name: "関連ファイル", after_value: name, actor_id: user.id, actor_name: user.name ?? null },
    })
    return created
  })
  return NextResponse.json(file)
}
