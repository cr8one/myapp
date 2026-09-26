import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
export const maxDuration = 60
const s3 = new S3Client({ region: "ap-northeast-1", requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" })
const BUCKET = "japan-sleeve-system-files-936533876784"
const PAGE_SIZE = 50
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const delFlg = searchParams.get("delFlg")
  const page = parseInt(searchParams.get("page") ?? "1") || 1
  const where = {
    ...(keyword ? { OR: [
      { tray_cd: { contains: keyword } },
      { tray_nm: { contains: keyword } },
      { tray_nm2: { contains: keyword } },
      { tray_ryaku_nm: { contains: keyword } },
      { t_maker: { contains: keyword } },
      { rendo_tray_cd: { contains: keyword } },
    ]} : {}),
    ...(delFlg !== null && delFlg !== "" ? { del_flg: parseInt(delFlg) } : {}),
  }
  const [records, total] = await Promise.all([
    prisma.prinserMTray.findMany({
      where,
      orderBy: { tray_cd: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.prinserMTray.count({ where }),
  ])
  return NextResponse.json({ records, total })
}
export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const key = `prinser/m_tray_import_${Date.now()}.csv`
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: "text/csv" })
  const url = await getSignedUrl(s3, command, { expiresIn: 300 })
  return NextResponse.json({ url, key })
}
export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.prinserMTray.deleteMany({})
  return NextResponse.json({ ok: true })
}
