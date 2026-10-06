import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"
import { renderToBuffer, Font } from "@react-pdf/renderer"
import { createElement } from "react"
import IrregularOrderPdf from "@/app/dashboard/tray/irregular-orders/pdf/IrregularOrderPdf"
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

const pad = (n: number) => String(n).padStart(2, "0")
const signedInkanUrl = (key: string) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 300 })

// PDF出力：イレギュラートレイ発注書（A4横・1枚）
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("trayView")
  if (denied) return denied
  const { id } = await params

  const order = await prisma.trayIrregularOrder.findUnique({
    where: { id },
    include: {
      items: { orderBy: [{ usage_month: "asc" }, { created_at: "asc" }] },
      steps: { orderBy: { step_order: "asc" } },
    },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // トレイ名
  const codes = Array.from(new Set(order.items.map(i => i.rendo_tray_cd)))
  const trays = await prisma.mTray.findMany({
    where: { rendo_tray_cd: { in: codes } },
    select: { rendo_tray_cd: true, name: true },
  })
  const nameByCode = new Map(trays.map(t => [t.rendo_tray_cd, t.name]))

  // 承認済みのステップだけ、承認者の印影を表示する
  const approvedIds = order.steps.filter(s => s.status === "承認済" && s.approver_user_id).map(s => s.approver_user_id as string)
  const approvers = approvedIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: approvedIds } }, select: { id: true, inkanImageKey: true } })
    : []
  const inkanUrlById: Record<string, string> = {}
  for (const u of approvers) {
    if (u.inkanImageKey) inkanUrlById[u.id] = await signedInkanUrl(u.inkanImageKey)
  }

  // 申請者の印影：承認依頼後（承認依頼中・承認済）のみ表示する
  let requesterInkanUrl: string | undefined
  if (order.status !== "作成中" && order.requester_id) {
    const requester = await prisma.user.findUnique({ where: { id: order.requester_id }, select: { inkanImageKey: true } })
    if (requester?.inkanImageKey) requesterInkanUrl = await signedInkanUrl(requester.inkanImageKey)
  }

  // 押印欄は右詰め。右端が申請者、その左から承認ステップを逆順で並べる
  const stamps = [
    ...[...order.steps].reverse().map(s => {
      const approved = s.status === "承認済"
      const url = approved && s.approver_user_id ? inkanUrlById[s.approver_user_id] : undefined
      return {
        label: s.label || s.stage,
        inkan_image_url: url,
        name: approved && !url ? (s.approver_name ?? undefined) : undefined,
      }
    }),
    {
      label: "申請者",
      inkan_image_url: requesterInkanUrl,
      name: order.status !== "作成中" && !requesterInkanUrl ? order.requester_name : undefined,
    },
  ]

  // 依頼日（JST）
  const rd = new Date(order.request_date.getTime() + 9 * 60 * 60 * 1000)
  const requestDate = `${rd.getUTCFullYear()}/${pad(rd.getUTCMonth() + 1)}/${pad(rd.getUTCDate())}`

  const items = order.items.map(i => ({
    year: i.usage_month.slice(0, 4),
    month: String(Number(i.usage_month.slice(4, 6))),
    tray_name: nameByCode.get(i.rendo_tray_cd) ?? i.rendo_tray_cd,
    qty: i.planned_qty.toLocaleString("en-US"),
  }))

  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const ts = `${String(jstNow.getUTCFullYear()).slice(2)}${pad(jstNow.getUTCMonth() + 1)}${pad(jstNow.getUTCDate())}${pad(jstNow.getUTCHours())}${pad(jstNow.getUTCMinutes())}${pad(jstNow.getUTCSeconds())}`
  const fileName = `${ts}_イレギュラートレイ発注書.pdf`

  const buf = await renderToBuffer(
    createElement(IrregularOrderPdf, {
      order_no: order.order_no,
      status: order.status,
      request_date: requestDate,
      title: order.title,
      items,
      stamps,
    }) as any
  )

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
