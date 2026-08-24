import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { renderToBuffer, Font } from "@react-pdf/renderer"
import { createElement } from "react"
import RingiRequestPdf from "@/app/dashboard/eapp/ringi/pdf/RingiRequestPdf"
import path from "path"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const BUCKET = "japan-sleeve-system-files-936533876784"

Font.register({
  family: "NotoSansJP",
  src: path.join(process.cwd(), "public/NotoSansJP.otf"),
})

const n = (v: string | null | undefined) => v ?? undefined

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const record = await prisma.ringiRequest.findUnique({
    where: { id },
    include: {
      approval_steps: { orderBy: { step_order: "asc" } },
    },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const approverEmails = record.approval_steps.map(s => s.approver_email).filter((e): e is string => !!e)
  const approverUsers = approverEmails.length > 0
    ? await prisma.user.findMany({ where: { email: { in: approverEmails } }, select: { email: true, inkanImageKey: true } })
    : []
  const inkanUrlByEmail: Record<string, string> = {}
  for (const u of approverUsers) {
    if (u.inkanImageKey) {
      inkanUrlByEmail[u.email] = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: u.inkanImageKey }), { expiresIn: 300 })
    }
  }

  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  const ts = `${String(jstNow.getUTCFullYear()).slice(2)}${pad(jstNow.getUTCMonth() + 1)}${pad(jstNow.getUTCDate())}${pad(jstNow.getUTCHours())}${pad(jstNow.getUTCMinutes())}${pad(jstNow.getUTCSeconds())}`
  const fileName = `${ts}_稟議書.pdf`

  const buf = await renderToBuffer(
    createElement(RingiRequestPdf, {
      title: record.title,
      content: n(record.content),
      destination: n(record.destination),
      cost: n(record.cost),
      requester_names: n(record.requester_names),
      requester_department: n(record.requester_department),
      reception_number: n(record.reception_number),
      reception_date: record.reception_date?.toISOString() ?? undefined,
      decision_date: record.decision_date?.toISOString() ?? undefined,
      decision_result: n(record.decision_result),
      created_at: record.created_at.toISOString(),
      approval_steps: record.approval_steps.map(s => ({
        stage: s.stage,
        step_order: s.step_order,
        position_name: n(s.position_name),
        category: n(s.category),
        approver_name: n(s.approver_name),
        status: s.status,
        approved_at: s.approved_at?.toISOString() ?? undefined,
        inkan_image_url: s.approver_email ? inkanUrlByEmail[s.approver_email] : undefined,
      })),
    }) as any
  )

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
