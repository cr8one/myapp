import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { createElement } from "react"
import { renderToBuffer, Font } from "@react-pdf/renderer"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, slipVisibilityWhere } from "@/lib/accounting-slip-access"
import { STATUS_COMPLETED } from "@/lib/accounting-slip-approval"
import TripExpensePdf, { TripPdfData } from "@/app/dashboard/eapp/accounting/pdf/TripExpensePdf"

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

const jst = (d: Date) => new Date(d.getTime() + 9 * 60 * 60 * 1000)
const pad = (n: number) => String(n).padStart(2, "0")

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  // 見てよい伝票だけを対象にする。見られない伝票は、存在しない伝票と同じく404
  const slip = await prisma.acctSlip.findFirst({
    where: { AND: [{ id }, slipVisibilityWhere(viewer)] },
    select: {
      slip_no: true,
      slip_type: true,
      status: true,
      slip_date: true,
      requester_name: true,
      department_name: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { stage: true, position_name: true, approver_id: true, approver_name: true, status: true, approved_at: true },
      },
      trip_expense: true,
    },
  })
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== STATUS_COMPLETED) {
    return NextResponse.json({ error: "承認が完了した伝票だけ、PDFに出力できます" }, { status: 400 })
  }
  const t = slip.trip_expense
  if (slip.slip_type !== "trip_expense" || !t) {
    return NextResponse.json({ error: "この種類の伝票は、まだPDFに出力できません" }, { status: 400 })
  }

  // 承認印：承認済みのステップだけ、承認者のユーザーマスタの印影画像を使う（承認者はユーザーIDで特定する）
  const approvedIds = slip.approval_steps
    .filter(s => s.status === "承認済み" && s.approver_id)
    .map(s => s.approver_id as string)
  const users = approvedIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: approvedIds } }, select: { id: true, inkanImageKey: true } })
    : []
  const stampUrlById: Record<string, string> = {}
  for (const u of users) {
    if (u.inkanImageKey) {
      stampUrlById[u.id] = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: u.inkanImageKey }), { expiresIn: 300 })
    }
  }

  const data: TripPdfData = {
    slipNo: slip.slip_no,
    slipDate: slip.slip_date.toISOString().slice(0, 10),
    requesterName: slip.requester_name,
    departmentName: slip.department_name,
    accountName: t.account_name,
    accountCode: t.account_code,
    taxCategory: t.tax_category,
    areaPurpose: t.area_purpose,
    tripDates: (t.trip_dates as unknown as TripPdfData["tripDates"] | null) ?? [],
    transport: (t.transport_items as unknown as TripPdfData["transport"] | null) ?? [],
    lodging: (t.lodging_items as unknown as TripPdfData["lodging"] | null) ?? [],
    allowance: (t.allowance_items as unknown as TripPdfData["allowance"] | null) ?? [],
    transportSubtotal: t.transport_subtotal,
    lodgingSubtotal: t.lodging_subtotal,
    allowanceSubtotal: t.allowance_subtotal,
    total: t.total_amount,
    approvals: slip.approval_steps.map(s => {
      const approved = s.status === "承認済み"
      const j = s.approved_at ? jst(s.approved_at) : null
      return {
        stage: s.stage,
        positionName: s.position_name,
        approverName: s.approver_name,
        approved,
        dateText: approved && j ? `${j.getUTCMonth() + 1}/${j.getUTCDate()}` : null,
        stampUrl: approved && s.approver_id ? stampUrlById[s.approver_id] ?? null : null,
      }
    }),
  }

  const buf = await renderToBuffer(createElement(TripExpensePdf, { data }) as any)

  const now = jst(new Date())
  const ts = `${String(now.getUTCFullYear()).slice(2)}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  const fileName = `${ts}_出金伝票_${slip.slip_no}.pdf`

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
