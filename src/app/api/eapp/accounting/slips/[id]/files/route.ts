import { NextRequest, NextResponse } from "next/server"
import { HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import {
  acctS3, ACCT_BUCKET, ACCT_FILE_MAX_BYTES, ACCT_FILE_MAX_COUNT, contentTypeFromName, keyPrefix, checkFileEditable,
} from "@/lib/accounting-slip-files"

// アップロードの終わった添付を、伝票に登録する。S3に実物があることと、大きさを確かめる
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const denied = await checkFileEditable(viewer.userId, id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const body = await req.json().catch(() => ({}))
  const key = String(body.key ?? "")
  const fileName = String(body.file_name ?? "").trim().slice(0, 200)
  // この伝票のキーだけを受け付ける（他の伝票のファイルを登録されないようにする）
  if (!key.startsWith(keyPrefix(id))) return NextResponse.json({ error: "キーが正しくありません" }, { status: 400 })
  const contentType = contentTypeFromName(fileName)
  if (!fileName || !contentType) return NextResponse.json({ error: "ファイルの種類が正しくありません" }, { status: 400 })

  let size = 0
  try {
    const head = await acctS3.send(new HeadObjectCommand({ Bucket: ACCT_BUCKET, Key: key }))
    size = head.ContentLength ?? 0
  } catch {
    return NextResponse.json({ error: "アップロードを確認できません" }, { status: 400 })
  }
  if (size <= 0 || size > ACCT_FILE_MAX_BYTES) {
    await acctS3.send(new DeleteObjectCommand({ Bucket: ACCT_BUCKET, Key: key })).catch(() => {})
    return NextResponse.json({ error: `ファイルの大きさは、${ACCT_FILE_MAX_BYTES / 1024 / 1024}MBまでです` }, { status: 400 })
  }

  const count = await prisma.acctSlipFile.count({ where: { slip_id: id } })
  if (count >= ACCT_FILE_MAX_COUNT) {
    await acctS3.send(new DeleteObjectCommand({ Bucket: ACCT_BUCKET, Key: key })).catch(() => {})
    return NextResponse.json({ error: `添付は${ACCT_FILE_MAX_COUNT}個までです` }, { status: 400 })
  }
  const exists = await prisma.acctSlipFile.findFirst({ where: { file_key: key }, select: { id: true } })
  if (exists) return NextResponse.json({ error: "既に登録されています" }, { status: 400 })

  const record = await prisma.acctSlipFile.create({
    data: { slip_id: id, file_key: key, file_name: fileName, file_type: contentType },
    select: { id: true, file_name: true, file_type: true, uploaded_at: true },
  })
  return NextResponse.json(record)
}
