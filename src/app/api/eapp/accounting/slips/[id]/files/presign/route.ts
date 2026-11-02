import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import {
  acctS3, ACCT_BUCKET, ACCT_FILE_MAX_BYTES, ACCT_FILE_MAX_COUNT, contentTypeFromName, newKey, checkFileEditable,
} from "@/lib/accounting-slip-files"

// アップロードの準備：検査を通ったときだけ、S3への書き込み用の署名つきURLを返す
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const denied = await checkFileEditable(viewer.userId, id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const body = await req.json().catch(() => ({}))
  const fileName = String(body.file_name ?? "").trim()
  const size = Number(body.size)
  if (!fileName) return NextResponse.json({ error: "ファイル名がありません" }, { status: 400 })
  const contentType = contentTypeFromName(fileName)
  if (!contentType) return NextResponse.json({ error: "添付できるのは、PDFと画像（jpg・png・gif・webp・heic）です" }, { status: 400 })
  if (!Number.isFinite(size) || size <= 0 || size > ACCT_FILE_MAX_BYTES) {
    return NextResponse.json({ error: `ファイルの大きさは、${ACCT_FILE_MAX_BYTES / 1024 / 1024}MBまでです` }, { status: 400 })
  }
  const count = await prisma.acctSlipFile.count({ where: { slip_id: id } })
  if (count >= ACCT_FILE_MAX_COUNT) {
    return NextResponse.json({ error: `添付は${ACCT_FILE_MAX_COUNT}個までです` }, { status: 400 })
  }

  const key = newKey(id, fileName)
  const url = await getSignedUrl(acctS3, new PutObjectCommand({ Bucket: ACCT_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 })
  return NextResponse.json({ url, key, content_type: contentType })
}
