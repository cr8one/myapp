import { NextRequest, NextResponse } from "next/server"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getRegulationViewer, regS3, REG_BUCKET, REG_MAX_BYTES, newRegulationKey, isPdfName } from "@/lib/eapp-regulations"

// アップロードの準備：PDFだけ、20MBまで。管理できる人だけ
export async function POST(req: NextRequest) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const fileName = String(body.file_name ?? "").trim()
  const size = Number(body.size)
  if (!fileName || !isPdfName(fileName)) return NextResponse.json({ error: "PDFファイルを選択してください" }, { status: 400 })
  if (!Number.isFinite(size) || size <= 0 || size > REG_MAX_BYTES) {
    return NextResponse.json({ error: `ファイルの大きさは、${REG_MAX_BYTES / 1024 / 1024}MBまでです` }, { status: 400 })
  }
  const key = newRegulationKey(fileName)
  const url = await getSignedUrl(regS3, new PutObjectCommand({ Bucket: REG_BUCKET, Key: key, ContentType: "application/pdf" }), { expiresIn: 300 })
  return NextResponse.json({ url, key })
}
