import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { STAGE_REQUESTER, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"
import { checkActionableStep, STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"
import { LIMIT } from "@/lib/accounting-meal-advance-layout"

const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)

// 飲食費及び仮払精算書の、勘定科目と区分を、経理が入れる（金額や明細の中身は変えない）
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const b = await req.json().catch(() => ({}))
  const stepId = String(b?.step_id ?? "")
  if (!stepId) return NextResponse.json({ error: "承認ステップが指定されていません" }, { status: 400 })

  // 承認できる人だけ（本人の番で、前の順序が済んでいること）
  const denied = await checkActionableStep(viewer, id, stepId)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })
  // そのうえで、経理側のステップであること（起案側の承認者は入力できない）
  const step = await prisma.acctSlipApprovalStep.findUnique({ where: { id: stepId }, select: { stage: true } })
  if (!step || step.stage === STAGE_REQUESTER) {
    return NextResponse.json({ error: "経理側の承認者だけが入力できます" }, { status: 403 })
  }

  const slip = await prisma.acctSlip.findUnique({
    where: { id },
    select: { slip_type: true, status: true, meal_advance: { select: { items: true } } },
  })
  if (!slip || slip.slip_type !== "meal_advance" || !slip.meal_advance) {
    return NextResponse.json({ error: "この伝票では、勘定科目と区分を入力できません" }, { status: 400 })
  }
  if (slip.status !== STATUS_ACCOUNTING_APPROVING) {
    return NextResponse.json({ error: "経理承認中の伝票だけ、入力できます" }, { status: 400 })
  }

  const items = (slip.meal_advance.items as unknown as Record<string, unknown>[] | null) ?? []
  const input = Array.isArray(b.items) ? b.items : []
  if (input.length !== items.length) {
    return NextResponse.json({ error: "明細の行数が合いません。画面を更新してください" }, { status: 400 })
  }

  const next: Record<string, unknown>[] = []
  for (let i = 0; i < items.length; i++) {
    const r = input[i]
    const name = text(r?.account_name, 100)
    const code = text(r?.account_code, 20)
    const tax = text(r?.tax_category, 20)
    if (name.length > LIMIT.account) return NextResponse.json({ error: `勘定科目は${LIMIT.account}文字までです` }, { status: 400 })
    if (code.length > 10 || !/^[0-9-]*$/.test(code)) return NextResponse.json({ error: "勘定科目コードは、数字とハイフンで10文字までです" }, { status: 400 })
    if (tax.length > 10) return NextResponse.json({ error: "区分は10文字までです" }, { status: 400 })
    // 内訳（名前・金額・区分の組）。ある場合は、内訳の合計が行の金額と一致すること（金額や小計は変えない）
    const rawSplits = Array.isArray(r?.splits) ? r.splits : []
    if (rawSplits.length > 4) return NextResponse.json({ error: "内訳は、1行に4つまでです" }, { status: 400 })
    const splits: { name: string; amount: number; tax_category: string }[] = []
    for (const sp of rawSplits) {
      const sn = text(sp?.name, 100)
      const st = text(sp?.tax_category, 20)
      const sa = Number(sp?.amount ?? 0)
      if (!Number.isInteger(sa) || sa < 0 || sa > 99999999) return NextResponse.json({ error: "内訳の金額が正しくありません" }, { status: 400 })
      if (sn.length > 20) return NextResponse.json({ error: "内訳の名前は20文字までです" }, { status: 400 })
      if (st.length > 10) return NextResponse.json({ error: "内訳の区分は10文字までです" }, { status: 400 })
      if (!sn && sa === 0) continue
      splits.push({ name: sn, amount: sa, tax_category: st })
    }
    if (splits.length > 0) {
      const splitTotal = splits.reduce((s, x) => s + x.amount, 0)
      const base = Number(items[i].amount ?? 0)
      if (splitTotal !== base) {
        return NextResponse.json({ error: `内訳の合計（${splitTotal.toLocaleString()}円）が、行の金額（${base.toLocaleString()}円）と一致しません` }, { status: 400 })
      }
    }
    next.push({ ...items[i], account_name: name, account_code: code, tax_category: tax, splits })
  }
  const shortageAccount = text(b.shortage_account_name, 100)
  if (shortageAccount.length > LIMIT.account) {
    return NextResponse.json({ error: `仮払金不足の勘定科目は${LIMIT.account}文字までです` }, { status: 400 })
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 状態が途中で変わっていたら、取り消す
      const touched = await tx.acctSlip.updateMany({
        where: { id, status: STATUS_ACCOUNTING_APPROVING },
        data: { updated_at: new Date() },
      })
      if (touched.count === 0) throw new Error(STATE_CHANGED)
      await tx.acctMealAdvance.update({
        where: { slip_id: id },
        data: { items: next as any, shortage_account_name: shortageAccount || null },
      })
      await tx.acctSlipHistory.create({
        data: { slip_id: id, action: "勘定科目入力", actor_id: viewer.userId, actor_name: viewer.name ?? viewer.email },
      })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message === STATE_CHANGED) return NextResponse.json({ error: STATE_CHANGED_MESSAGE }, { status: 409 })
    throw e
  }
}
