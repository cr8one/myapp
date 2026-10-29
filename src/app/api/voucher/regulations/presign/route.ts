import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getSessionUser } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { voucherS3, VOUCHER_BUCKET, fileExtension } from "@/lib/voucher-storage"

const REGULATION_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"]

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const manager = user.role === "ADMIN" || !!(await prisma.mVoucherManager.findFirst({ where: { user_id: user.id, role: "管理責任者" } }))
  if (!manager) return NextResponse.json({ error: "管理責任者のみ操作できます" }, { status: 403 })

  const { filename } = await req.json()
  const name = String(filename ?? "").replace(/[\\/]/g, "_").trim()
  if (!name || !REGULATION_EXTENSIONS.includes(fileExtension(name))) {
    return NextResponse.json({ error: "PDF・Word・Excel・画像のファイルを選択してください" }, { status: 400 })
  }
  const key = `voucher/regulations/${Date.now()}_${name}`
  const url = await getSignedUrl(voucherS3, new PutObjectCommand({ Bucket: VOUCHER_BUCKET, Key: key }), { expiresIn: 300 })
  return NextResponse.json({ url, key })
}
