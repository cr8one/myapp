import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { buildApprovalSteps, STAGE_REQUESTER, STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"
import { SLIP_TYPES } from "@/lib/accounting-slip-types"

const TRIP = SLIP_TYPES.find(t => t.value === "trip_expense")!
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/
const toDate = (s: string) => new Date(`${s}T00:00:00.000Z`)
const validDate = (s: string) => DATE_RE.test(s) && !isNaN(toDate(s).getTime())
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === ""
const parseNum = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= 99999999 ? n : null
}
const sum = (xs: { amount: number }[]) => xs.reduce((a, x) => a + x.amount, 0)

export async function POST(req: NextRequest) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const b = await req.json()
  const submit = b.submit === true
  const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 })

  const dateText = String(b.slip_date ?? "")
  if (!validDate(dateText)) return bad("日付を入力してください")

  // 出張期間（最大2行：現地到着・現地出発）
  const rawDates = Array.isArray(b.trip_dates) ? b.trip_dates : []
  if (rawDates.length > 2) return bad("出張期間の行は2行までです")
  const tripDates: { label: string; date: string; time: string }[] = []
  for (const r of rawDates) {
    if (blank(r?.date) && blank(r?.time)) continue
    const date = text(r?.date, 10)
    const time = text(r?.time, 5)
    if (date && !validDate(date)) return bad("出張期間の日付が正しくありません")
    if (time && !TIME_RE.test(time)) return bad("出張期間の時間が正しくありません")
    tripDates.push({ label: text(r?.label, 20), date, time })
  }

  // 交通費（最大8行）
  const rawTransport = Array.isArray(b.transport_items) ? b.transport_items : []
  if (rawTransport.length > 8) return bad("交通費の行は8行までです")
  const transport: { section: string; amount: number }[] = []
  for (const r of rawTransport) {
    if (blank(r?.section) && blank(r?.amount)) continue
    const amount = blank(r?.amount) ? null : parseNum(r?.amount)
    if (amount === null) return bad("交通費の金額が正しくありません")
    transport.push({ section: text(r?.section, 100), amount })
  }

  // 宿泊費（最大3行）
  const rawLodging = Array.isArray(b.lodging_items) ? b.lodging_items : []
  if (rawLodging.length > 3) return bad("宿泊費の行は3行までです")
  const lodging: { name: string; nights: number; amount: number }[] = []
  for (const r of rawLodging) {
    if (blank(r?.name) && blank(r?.nights) && blank(r?.amount)) continue
    const amount = blank(r?.amount) ? null : parseNum(r?.amount)
    const nights = blank(r?.nights) ? 0 : parseNum(r?.nights)
    if (amount === null || nights === null) return bad("宿泊費の泊数または金額が正しくありません")
    lodging.push({ name: text(r?.name, 100), nights, amount })
  }

  // 日当（最大2行）
  const rawAllowance = Array.isArray(b.allowance_items) ? b.allowance_items : []
  if (rawAllowance.length > 2) return bad("日当の行は2行までです")
  const allowance: { days: number; amount: number }[] = []
  for (const r of rawAllowance) {
    if (blank(r?.days) && blank(r?.amount)) continue
    const amount = blank(r?.amount) ? null : parseNum(r?.amount)
    const days = blank(r?.days) ? 0 : parseNum(r?.days)
    if (amount === null || days === null) return bad("日当の日数または金額が正しくありません")
    allowance.push({ days, amount })
  }

  // 小計と精算合計は、画面から送られた値を使わず、ここで計算し直す
  const transportSubtotal = sum(transport)
  const lodgingSubtotal = sum(lodging)
  const allowanceSubtotal = sum(allowance)
  const total = transportSubtotal + lodgingSubtotal + allowanceSubtotal
  const areaPurpose = text(b.area_purpose, 1000)

  if (submit) {
    if (!areaPurpose) return bad("出張区域・用を入力してください")
    if (total <= 0) return bad("精算合計が0円です。金額を入力してください")
  }

  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const departmentName = text(b.department_name, 100) || info.departmentText || null
  const title = text(b.title, 100) || `${TRIP.label} ${dateText.replace(/-/g, "/")}`

  // 申請のときだけ、承認ステップを作る
  let steps: Awaited<ReturnType<typeof buildApprovalSteps>>["steps"] = []
  if (submit) {
    const built = await buildApprovalSteps(viewer.userId, TRIP.routeServiceType)
    if (built.error) return bad(built.error)
    steps = built.steps
  }
  const status = !submit
    ? DRAFT_STATUS
    : steps.some(s => s.stage === STAGE_REQUESTER) ? STATUS_REQUESTER_APPROVING : STATUS_ACCOUNTING_APPROVING

  const record = await prisma.acctSlip.create({
    data: {
      slip_type: TRIP.value,
      title,
      status,
      slip_date: toDate(dateText),
      amount: total,
      requester_id: viewer.userId,
      requester_name: info.name,
      department_name: departmentName,
      submitted_at: submit ? new Date() : null,
      trip_expense: {
        create: {
          account_name: text(b.account_name, 50) || undefined,
          account_code: text(b.account_code, 20) || undefined,
          tax_category: text(b.tax_category, 50) || undefined,
          area_purpose: areaPurpose || null,
          trip_dates: tripDates,
          transport_items: transport,
          lodging_items: lodging,
          allowance_items: allowance,
          transport_subtotal: transportSubtotal,
          lodging_subtotal: lodgingSubtotal,
          allowance_subtotal: allowanceSubtotal,
          total_amount: total,
        },
      },
      approval_steps: submit ? { create: steps } : undefined,
    },
    select: { id: true, slip_no: true, status: true },
  })
  return NextResponse.json(record)
}
