// 仮払金請求受領書と、精算書（飲食費及び仮払精算書・交際費精算書）の紐づけの確認。
// 作成APIと編集APIの両方から呼ぶ。紐づけできる請求は、次のすべてを満たすもの。
// - 自分が起案した仮払金請求受領書
// - 承認が完了している（支払と受領の記録ができたら、「受領済み」に絞り込む）
// - ほかの精算書に紐づいていない（却下された精算書は、紐づきを持たないものとして数える）
import { prisma } from "@/lib/prisma"
import { STATUS_COMPLETED } from "@/lib/accounting-slip-approval"

export const STATUS_REJECTED_FOR_LINK = "却下"

// 紐づける請求のIDを確認して、請求の仮払金額を返す。問題があれば、画面に出すエラーを返す。
// currentSlipId は、編集中の精算書のID（新規作成のときは null）。自分自身との紐づけは、ほかの精算書として数えない
export async function checkAdvanceLink(
  userId: string,
  advanceRequestId: string,
  currentSlipId: string | null
): Promise<{ error: string } | { amount: number }> {
  const target = await prisma.acctAdvanceRequest.findUnique({
    where: { id: advanceRequestId },
    select: {
      advance_amount: true,
      slip: { select: { slip_type: true, status: true, requester_id: true } },
      meal_advances: { select: { slip_id: true, slip: { select: { status: true } } } },
    },
  })
  if (!target || target.slip.slip_type !== "advance_request") return { error: "紐づける仮払金請求が見つかりません" }
  if (target.slip.requester_id !== userId) return { error: "自分が起案した仮払金請求だけ、紐づけできます" }
  if (target.slip.status !== STATUS_COMPLETED) return { error: "承認が完了した仮払金請求だけ、紐づけできます" }
  const taken = target.meal_advances.some(m => m.slip_id !== currentSlipId && m.slip.status !== STATUS_REJECTED_FOR_LINK)
  if (taken) return { error: "この仮払金請求は、すでにほかの精算書に紐づいています" }
  return { amount: target.advance_amount }
}

// 紐づけの候補（画面の選択欄に出す一覧）。自分の、承認が完了した、紐づいていない請求。currentSlipId は、編集中の精算書のID
export async function listLinkableAdvances(userId: string, currentSlipId: string | null) {
  const rows = await prisma.acctAdvanceRequest.findMany({
    where: { slip: { requester_id: userId, slip_type: "advance_request", status: STATUS_COMPLETED } },
    select: {
      id: true,
      advance_amount: true,
      purpose: true,
      slip: { select: { slip_no: true, slip_date: true } },
      meal_advances: { select: { slip_id: true, slip: { select: { status: true } } } },
    },
    orderBy: { slip: { slip_no: "desc" } },
  })
  return rows
    .filter(r => !r.meal_advances.some(m => m.slip_id !== currentSlipId && m.slip.status !== STATUS_REJECTED_FOR_LINK))
    .map(r => ({
      id: r.id,
      slip_no: r.slip.slip_no,
      slip_date: r.slip.slip_date.toISOString().slice(0, 10),
      amount: r.advance_amount,
      purpose: r.purpose,
    }))
}
