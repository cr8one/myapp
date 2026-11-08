import { prisma } from "@/lib/prisma"
import { PcViewer, pcVisibilityWhere } from "@/lib/pc-takeout-access"
import { PC_STATUS_CONFIRMING, PC_STATUS_ISMS } from "@/lib/pc-takeout"

export { STATE_CHANGED, STATE_CHANGED_MESSAGE } from "@/lib/accounting-slip-step"

// 承認・差戻し・却下に共通のチェック。問題があれば { error, status } を返し、問題なければ null を返す。
// - 見てよい申請だけを対象にする（見られない申請は存在しない申請と同じく404）
// - 申請が承認中であること
// - ログイン中の本人が、そのステップの承認者であること
// - そのステップが未処理で、前の順序がすべて承認済みであること
export async function checkActionablePcStep(
  viewer: PcViewer,
  requestId: string,
  stepId: string
): Promise<{ error: string; status: number } | null> {
  const request = await prisma.pcTakeoutRequest.findFirst({
    where: { AND: [{ id: requestId }, pcVisibilityWhere(viewer)] },
    select: {
      status: true,
      approval_steps: {
        orderBy: { step_order: "asc" },
        select: { id: true, step_order: true, approver_id: true, status: true },
      },
    },
  })
  if (!request) return { error: "Not found", status: 404 }
  const target = request.approval_steps.find(s => s.id === stepId)
  if (!target) return { error: "Not found", status: 404 }
  if (request.status !== PC_STATUS_CONFIRMING && request.status !== PC_STATUS_ISMS) {
    return { error: "この申請は、今は操作できません", status: 400 }
  }
  if (!target.approver_id || target.approver_id !== viewer.userId) {
    return { error: "このステップの承認者本人のみ操作できます", status: 403 }
  }
  if (target.status === "承認済み") return { error: "既に承認済みです", status: 400 }
  const blockedByEarlier = request.approval_steps.some(s => s.step_order < target.step_order && s.status !== "承認済み")
  if (blockedByEarlier) return { error: "前の順序の承認が完了していないため操作できません", status: 400 }
  return null
}
