import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { renderToBuffer, Font } from "@react-pdf/renderer"
import { createElement } from "react"
import TokuiCreditRequestPdf from "@/app/dashboard/eapp/customers/pdf/TokuiCreditRequestPdf"
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

  const record = await prisma.tokuiCreditRequest.findUnique({
    where: { id },
    include: {
      approval_steps: { orderBy: { step_order: "asc" } },
    },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // 承認者のemailからUserを引き当て、印影画像があれば署名付きURLを取得
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

  const buf = await renderToBuffer(
    createElement(TokuiCreditRequestPdf, {
      uid: record.uid,
      requested_date: record.requested_date?.toISOString() ?? undefined,
      company_name: n(record.company_name),
      industry: n(record.industry),
      representative_name: n(record.representative_name),
      capital: n(record.capital),
      established_year_month: n(record.established_year_month),
      annual_revenue: n(record.annual_revenue),
      employee_count: n(record.employee_count),
      main_bank_name: n(record.main_bank_name),
      main_bank_branch: n(record.main_bank_branch),
      postal_code: n(record.postal_code),
      address: n(record.address),
      tel: n(record.tel),
      fax: n(record.fax),
      payment_terms: n(record.payment_terms),
      order_contact_dept: n(record.order_contact_dept),
      order_contact_name: n(record.order_contact_name),
      sales_rep_name: n(record.sales_rep_name),
      order_items: n(record.order_items),
      order_amount: n(record.order_amount),
      future_prospects: n(record.future_prospects),
      requested_credit_limit: n(record.requested_credit_limit),
      manager_comment: n(record.manager_comment),
      division_head_comment: n(record.division_head_comment),
      accounting_comment: n(record.accounting_comment),
      approved_credit_limit: n(record.approved_credit_limit),
      approved_date: record.approved_date?.toISOString() ?? undefined,
      remarks: n(record.remarks),
      approval_steps: record.approval_steps.map(s => ({
        step_order: s.step_order,
        position_name: n(s.position_name),
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
      "Content-Disposition": `attachment; filename="tokui-credit-request-${record.uid}.pdf"`,
    },
  })
}