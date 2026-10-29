import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/permissions"
import { isVoucherKey, fileExtension } from "@/lib/voucher-storage"

const REGULATION_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"]

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const manager = user.role === "ADMIN" || !!(await prisma.mVoucherManager.findFirst({ where: { user_id: user.id, role: "管理責任者" } }))
  if (!manager) return NextResponse.json({ error: "管理責任者のみ追加できます" }, { status: 403 })
  const { id } = await params
  const { file_key, file_name } = await req.json()
  const name = String(file_name ?? "")
  if (!isVoucherKey(file_key) || !REGULATION_EXTENSIONS.includes(fileExtension(name))) {
    return NextResponse.json({ error: "ファイルが正しくありません" }, { status: 400 })
  }
  const regulation = await prisma.voucherRegulation.findUnique({ where: { id } })
  if (!regulation) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const file = await prisma.voucherRegulationFile.create({
    data: { regulation_id: id, file_key, file_name: name, file_type: fileExtension(name) },
  })
  return NextResponse.json(file)
}
