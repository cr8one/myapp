import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prisma } from "@/lib/prisma"
import { getRegulationViewer, regS3, REG_BUCKET } from "@/lib/eapp-regulations"

// PDFを開くためのURL：ログインしている全員に、最新の版の、5分間だけ有効なURLを返す。
// 過去の版（version_id）を指定できるのは、管理できる人だけ
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const versionId = new URL(req.url).searchParams.get("version_id")

  const version = versionId && viewer.canManage
    ? await prisma.eappRegulationVersion.findFirst({ where: { id: versionId, regulation_id: id } })
    : await prisma.eappRegulationVersion.findFirst({ where: { regulation_id: id }, orderBy: { uploaded_at: "desc" } })
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const url = await getSignedUrl(
    regS3,
    new GetObjectCommand({
      Bucket: REG_BUCKET,
      Key: version.file_key,
      ResponseContentType: "application/pdf",
      ResponseContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(version.file_name)}`,
    }),
    { expiresIn: 300 }
  )
  return NextResponse.json({ url })
}
