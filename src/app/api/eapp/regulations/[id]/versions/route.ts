import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRegulationViewer, REG_PREFIX, verifyPdfObject, deleteRegulationObject, isPdfName, text } from "@/lib/eapp-regulations"

// 差し替え：新しい版を足す。古い版は、データベースとS3に残る（画面には、最新だけが出る）
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })
  const { id } = await params

  if (!(await prisma.eappRegulation.findUnique({ where: { id }, select: { id: true } }))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const b = await req.json().catch(() => ({}))
  const fileKey = String(b.file_key ?? "")
  const fileName = text(b.file_name, 200)
  if (!fileKey.startsWith(REG_PREFIX) || !isPdfName(fileName)) return NextResponse.json({ error: "PDFファイルを選択してください" }, { status: 400 })
  if (await prisma.eappRegulationVersion.findFirst({ where: { file_key: fileKey }, select: { id: true } })) {
    return NextResponse.json({ error: "既に登録されています" }, { status: 400 })
  }
  const err = await verifyPdfObject(fileKey)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  try {
    const record = await prisma.eappRegulationVersion.create({
      data: { regulation_id: id, version_label: text(b.version_label, 50) || null, file_key: fileKey, file_name: fileName, uploader_id: viewer.userId, uploader_name: viewer.name },
      select: { id: true },
    })
    return NextResponse.json(record)
  } catch (e) {
    await deleteRegulationObject(fileKey)
    throw e
  }
}
