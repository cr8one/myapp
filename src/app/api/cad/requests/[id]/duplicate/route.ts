import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { S3Client, CopyObjectCommand } from "@aws-sdk/client-s3"
import { createAuditLog } from "@/lib/audit"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { fields } = await req.json() as { fields: Record<string, boolean> }

  const original = await prisma.cadRequest.findUnique({ where: { id }, include: { files: true } })
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const maxResult = await prisma.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(uid AS INTEGER)) as max FROM t_cad_requests WHERE uid ~ '^[0-9]+$'
  `
  const currentMax = maxResult[0]?.max ?? 10000
  const nextNum = String(Math.max(currentMax + 1, 10001)).padStart(5, "0")
  const now = new Date()

  const data: Record<string, unknown> = {
    uid: nextNum,
    request_date: now,
    request_time: now.toTimeString().slice(0, 5),
    requester_name: "",
    status: "作成中",
    flg_del: 0,
    desired_date: null,
    desired_time: null,
    desired_time_kbn: 0,
    desired_time_sort: null,
  }

  if (fields.department) data.department = original.department
  if (fields.requester) { data.requester_name = original.requester_name; data.requester_id = original.requester_id }
  if (fields.client) data.client = original.client
  if (fields.title) data.title = original.title
  if (fields.genre) data.genre = original.genre
  if (fields.hinmoku) data.hinmoku = original.hinmoku
  if (fields.hinban) data.hinban = original.hinban
  if (fields.content) data.content = original.content
  if (fields.dieline_no) data.dieline_no = original.dieline_no
  if (fields.develop) { data.develop_y = original.develop_y; data.develop_x = original.develop_x }
  if (fields.paper) data.paper = original.paper
  if (fields.finish_count) data.finish_count = original.finish_count
  if (fields.tray_spec) {
    data.flg_tray_spec = original.flg_tray_spec
    data.tray = original.tray
    data.degi_spec = original.degi_spec
    data.tray_count = original.tray_count
    data.pocket = original.pocket
  }
  if (fields.remarks) data.remarks = original.remarks

  const created = await prisma.cadRequest.create({ data: data as Parameters<typeof prisma.cadRequest.create>[0]["data"] })

  if (fields.attachments && original.files.length > 0) {
    for (const f of original.files) {
      const newKey = `cad/requests/${created.id}/${Date.now()}_${f.file_name}`
      await s3.send(new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${encodeURIComponent(f.file_key).replace(/%2F/g, "/")}`,
        Key: newKey,
      }))
      await prisma.cadRequestFile.create({
        data: { request_id: created.id, file_key: newKey, file_name: f.file_name, file_type: f.file_type },
      })
    }
  }

  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "CREATE",
    targetModel: "CadRequest",
    targetId: created.id,
    targetLabel: created.uid,
    diff: {
      classification: "複製",
      changedFields: [{ field: "duplicate_source", label: "複製元", before: original.uid, after: "—" }],
    },
  })

  return NextResponse.json(created)
}
