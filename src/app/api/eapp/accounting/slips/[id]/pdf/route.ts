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
import MealAdvancePdf, { MealPdfData } from "@/app/dashboard/eapp/accounting/pdf/MealAdvancePdf"

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

// 飲食費及び仮払精算書の明細（Jsonに保存している形）
type MealItemJson = {
  type?: string
  payee?: string; address?: string; meal_date?: string; tel?: string; kind?: string
  headcount?: number; participants?: string
  item?: string; amount?: number
  account_name?: string; account_code?: string; tax_category?: string
  splits?: { name?: string; amount?: number; tax_category?: string }[]
}

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
      department_code: true,
      department_name: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { stage: true, position_name: true, approver_id: true, approver_name: true, status: true, approved_at: true },
      },
      trip_expense: true,
      meal_advance: true,
    },
  })
  if (!slip) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (slip.status !== STATUS_COMPLETED) {
    return NextResponse.json({ error: "承認が完了した伝票だけ、PDFに出力できます" }, { status: 400 })
  }
  const t = slip.trip_expense
  const m = slip.meal_advance
  if (!((slip.slip_type === "trip_expense" && t) || (slip.slip_type === "meal_advance" && m))) {
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

  const approvals = slip.approval_steps.map(s => {
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
  })

  let element: any
  let fileLabel: string

  if (slip.slip_type === "meal_advance" && m) {
    const items = (m.items as unknown as MealItemJson[] | null) ?? []
    const data: MealPdfData = {
      slipNo: slip.slip_no,
      slipDate: slip.slip_date.toISOString().slice(0, 10),
      requesterName: slip.requester_name,
      departmentCode: slip.department_code,
      departmentName: slip.department_name,
      purpose: m.purpose,
      remarks: m.remarks,
      meals: items.filter(x => x.type !== "other").map(x => ({
        payee: x.payee ?? "",
        address: x.address ?? "",
        mealDate: x.meal_date ?? "",
        tel: x.tel ?? "",
        kind: x.kind ?? "",
        headcount: x.headcount ?? 0,
        participants: x.participants ?? "",
        amount: x.amount ?? 0,
        accountName: x.account_name ?? "",
        accountCode: x.account_code ?? "",
        taxCategory: x.tax_category ?? "",
        splits: (x.splits ?? []).map(sp => ({ name: sp.name ?? "", amount: sp.amount ?? 0, taxCategory: sp.tax_category ?? "" })),
      })),
      others: items.filter(x => x.type === "other").map(x => ({
        item: x.item ?? "",
        amount: x.amount ?? 0,
        accountName: x.account_name ?? "",
        accountCode: x.account_code ?? "",
        taxCategory: x.tax_category ?? "",
      })),
      subtotal: m.subtotal,
      advance: m.advance_amount,
      shortage: m.shortage_amount,
      balance: m.balance_amount,
      shortageAccountName: m.shortage_account_name,
      approvals,
    }
    element = createElement(MealAdvancePdf, { data })
    fileLabel = "飲食費及び仮払精算書"
  } else if (slip.slip_type === "trip_expense" && t) {
    const data: TripPdfData = {
      slipNo: slip.slip_no,
      slipDate: slip.slip_date.toISOString().slice(0, 10),
      requesterName: slip.requester_name,
      departmentName: [slip.department_code, slip.department_name].filter(Boolean).join(" ") || null,
      accountName: t.account_name,
      accountCode: t.account_code,
      taxCategory: t.tax_category,
      // 新しい伝票は「出張区域：〜／出張目的：〜」の2行。これまでの伝票は、これまでの文章をそのまま渡す
      areaPurpose: (t.trip_area || t.trip_purpose)
        ? `出張区域：${t.trip_area ?? ""}\n出張目的：${t.trip_purpose ?? ""}`
        : t.area_purpose,
      tripDates: (t.trip_dates as unknown as TripPdfData["tripDates"] | null) ?? [],
      transport: (t.transport_items as unknown as TripPdfData["transport"] | null) ?? [],
      lodging: (t.lodging_items as unknown as TripPdfData["lodging"] | null) ?? [],
      allowance: (t.allowance_items as unknown as TripPdfData["allowance"] | null) ?? [],
      transportSubtotal: t.transport_subtotal,
      lodgingSubtotal: t.lodging_subtotal,
      allowanceSubtotal: t.allowance_subtotal,
      total: t.total_amount,
      approvals,
    }
    element = createElement(TripExpensePdf, { data })
    fileLabel = "出金伝票"
  } else {
    return NextResponse.json({ error: "この種類の伝票は、まだPDFに出力できません" }, { status: 400 })
  }

  const buf = await renderToBuffer(element)

  const now = jst(new Date())
  const ts = `${String(now.getUTCFullYear()).slice(2)}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  const fileName = `${ts}_${fileLabel}_${slip.slip_no}.pdf`

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
