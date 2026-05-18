import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { TextractClient, DetectDocumentTextCommand } from "@aws-sdk/client-textract"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

const textract = new TextractClient({ region: "ap-northeast-1" })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 })

  // S3からファイルをバイナリで取得
  const s3Res = await s3.send(new GetObjectCommand({
    Bucket: "japan-sleeve-system-files-936533876784",
    Key: key,
  }))
  const bytes = await s3Res.Body?.transformToByteArray()
  if (!bytes) return NextResponse.json({ error: "ファイル取得失敗" }, { status: 500 })

  // Textractでテキスト検出
  const result = await textract.send(new DetectDocumentTextCommand({
    Document: { Bytes: bytes },
  }))

  // ブロックからテキストを抽出
  const lines = (result.Blocks ?? [])
    .filter(b => b.BlockType === "LINE")
    .map(b => ({ text: b.Text ?? "", confidence: Math.round(b.Confidence ?? 0) }))

  const fullText = lines.map(l => l.text).join("\n")

  return NextResponse.json({ lines, fullText })
}
