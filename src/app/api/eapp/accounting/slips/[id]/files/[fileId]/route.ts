import { NextRequest, NextResponse } from "next/server"
import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { acctS3, ACCT_BUCKET, checkFileEditable } from "@/lib/accounting-slip-files"

// 添付の削除：起案者本人が、下書きまたは差戻しのときだけできる
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, fileId } = await params

  const denied = await checkFileEditable(viewer.userId, id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const file = await prisma.acctSlipFile.findFirst({ where: { id: fileId, slip_id: id }, select: { id: true, file_key: true } })
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.acctSlipFile.delete({ where: { id: file.id } })
  // S3の実物の削除は、できなくても、操作は成功として扱う（ログに残す）
  await acctS3.send(new DeleteObjectCommand({ Bucket: ACCT_BUCKET, Key: file.file_key })).catch(e => console.error("添付の削除エラー:", e))
  return NextResponse.json({ ok: true })
}
