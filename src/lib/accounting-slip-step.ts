import { prisma } from "@/lib/prisma"
import { AccountingViewer, slipVisibilityWhere } from "@/lib/accounting-slip-access"
import { STATUS_REQUESTER_APPROVING, STATUS_ACCOUNTING_APPROVING } from "@/lib/accounting-slip-approval"

// 承認・差戻し・却下に共通のチェック。問題があれば { error, status } を返し、問題なければ null を返す。
// - 見てよい伝票だけを対象にする（見られない伝票は存在しない伝票と同じく404）
// - 伝票が承認中であること
// - ログイン中の本人が、そのステップの承認者であること
// - そのステップが未処理で、前の順序がすべて承認済みであること
export async function checkActionableStep(
  viewer: AccountingViewer,
  slipId: string,
  stepId: string
): Promise<{ error: string; status: number } | null> {
  const slip = await prisma.acctSlip.findFirst({
    where: { AND: [{ id: slipId }, slipVisibilityWhere(viewer)] },
    select: {
      status: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { id: true, step_order: true, approver_id: true, status: true },
      },
    },
  })
  if (!slip) return { error: "Not found", status: 404 }
  const target = slip.approval_steps.find(s => s.id === stepId)
  if (!target) return { error: "Not found", status: 404 }
  if (slip.status !== STATUS_REQUESTER_APPROVING && slip.status !== STATUS_ACCOUNTING_APPROVING) {
    return { error: "この伝票は、今は操作できません", status: 400 }
  }
  if (!target.approver_id || target.approver_id !== viewer.userId) {
    return { error: "このステップの承認者本人のみ操作できます", status: 403 }
  }
  if (target.status === "承認済み") return { error: "既に承認済みです", status: 400 }
  const blockedByEarlier = slip.approval_steps.some(s => s.step_order < target.step_order && s.status !== "承認済み")
  if (blockedByEarlier) return { error: "前の順序の承認が完了していないため操作できません", status: 400 }
  return null
}

export const STATE_CHANGED = "STATE_CHANGED"
export const STATE_CHANGED_MESSAGE = "伝票の状態が変わりました。画面を更新してください"
