import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, slipVisibilityWhere } from "@/lib/accounting-slip-access"
import { acctS3, ACCT_BUCKET } from "@/lib/accounting-slip-files"

// 添付の閲覧用URL：伝票を見てよい人だけに、5分間だけ有効なURLを返す。見られない人には404
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; fileId: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id, fileId } = await params

  const slip = await prisma.acctSlip.findFirst({
    where: { AND: [{ id }, slipVisibilityWhere(viewer)] },
    select: { files: { where: { id: fileId }, select: { file_key: true, file_name: true, file_type: true } } },
  })
  const file = slip?.files[0]
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const url = await getSignedUrl(
    acctS3,
    new GetObjectCommand({
      Bucket: ACCT_BUCKET,
      Key: file.file_key,
      ResponseContentType: file.file_type,
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(file.file_name)}`,
    }),
    { expiresIn: 300 }
  )
  return NextResponse.json({ url })
}
