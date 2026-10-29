import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"
import { isVoucherKey, fileExtension } from "@/lib/voucher-storage"

export async function GET() {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const records = await prisma.voucherRegulation.findMany({
    orderBy: { created_at: "desc" },
    include: { files: { orderBy: { uploaded_at: "asc" } } },
  })
  return NextResponse.json(records)
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const manager = user.role === "ADMIN" || !!(await prisma.mVoucherManager.findFirst({ where: { user_id: user.id, role: "管理責任者" } }))
  if (!manager) return NextResponse.json({ error: "管理責任者のみ登録できます" }, { status: 403 })

  const b = await req.json()
  const title = String(b.title ?? "").trim()
  const version = String(b.version ?? "").trim()
  const fileName = String(b.file_name ?? "")
  if (!title) return NextResponse.json({ error: "名前を入力してください" }, { status: 400 })
  if (!version) return NextResponse.json({ error: "バージョンを入力してください" }, { status: 400 })
  if (!isVoucherKey(b.file_key) || fileExtension(fileName) !== "pdf") {
    return NextResponse.json({ error: "規程の本体は、PDFファイルを選択してください" }, { status: 400 })
  }
  const record = await prisma.voucherRegulation.create({
    data: {
      title,
      version,
      remarks: String(b.remarks ?? "").trim() || null,
      file_key: b.file_key,
      file_name: fileName,
      registrant_id: user.id,
      registrant_name: user.name ?? null,
    },
  })
  return NextResponse.json(record)
}
