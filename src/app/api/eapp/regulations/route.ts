import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRegulationViewer, REG_PREFIX, verifyPdfObject, deleteRegulationObject, isPdfName, text } from "@/lib/eapp-regulations"

// 一覧：ログインしている全員が、最新の版を見られる。管理できる人には、過去の版の履歴も返す
export async function GET() {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const list = await prisma.eappRegulation.findMany({
    orderBy: [{ sort_order: "asc" }, { title: "asc" }],
    include: { versions: { orderBy: { uploaded_at: "desc" } } },
  })
  const regulations = list
    .filter(r => viewer.canManage || r.versions.length > 0)
    .map(r => {
      const [latest, ...older] = r.versions
      const pick = (v: (typeof r.versions)[number]) => ({
        id: v.id, version_label: v.version_label, file_name: v.file_name, uploader_name: v.uploader_name, uploaded_at: v.uploaded_at,
      })
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        sort_order: r.sort_order,
        latest: latest ? pick(latest) : null,
        history: viewer.canManage ? older.map(pick) : [],
      }
    })
  return NextResponse.json({ regulations, can_manage: viewer.canManage })
}

// 登録：名前と、最初の版のPDF
export async function POST(req: NextRequest) {
  const viewer = await getRegulationViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!viewer.canManage) return NextResponse.json({ error: "システム管理者と経理担当だけが操作できます" }, { status: 403 })

  const b = await req.json().catch(() => ({}))
  const title = text(b.title, 100)
  const fileKey = String(b.file_key ?? "")
  const fileName = text(b.file_name, 200)
  if (!title) return NextResponse.json({ error: "名前を入力してください" }, { status: 400 })
  if (!fileKey.startsWith(REG_PREFIX) || !isPdfName(fileName)) return NextResponse.json({ error: "PDFファイルを選択してください" }, { status: 400 })
  if (await prisma.eappRegulationVersion.findFirst({ where: { file_key: fileKey }, select: { id: true } })) {
    return NextResponse.json({ error: "既に登録されています" }, { status: 400 })
  }
  const err = await verifyPdfObject(fileKey)
  if (err) return NextResponse.json({ error: err }, { status: 400 })

  const sortOrder = Number.isInteger(Number(b.sort_order)) ? Number(b.sort_order) : 0
  try {
    const record = await prisma.eappRegulation.create({
      data: {
        title,
        description: text(b.description, 500) || null,
        sort_order: sortOrder,
        versions: {
          create: { version_label: text(b.version_label, 50) || null, file_key: fileKey, file_name: fileName, uploader_id: viewer.userId, uploader_name: viewer.name },
        },
      },
      select: { id: true },
    })
    return NextResponse.json(record)
  } catch (e) {
    await deleteRegulationObject(fileKey)
    throw e
  }
}
