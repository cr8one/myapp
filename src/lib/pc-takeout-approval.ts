import { prisma } from "@/lib/prisma"
import { PC_SERVICE_TYPE, PC_ROLE_CONFIRMER, PC_ROLE_ISMS, PC_STATUS_CONFIRMING, PC_STATUS_ISMS } from "@/lib/pc-takeout"

export type NewPcApprovalStep = {
  step_order: number
  role: string
  position_name: string | null
  approver_id: string
  approver_name: string | null
  approver_email: string
}

// 申請の時点で、承認ステップを作る（スナップショット）。
// 確認者：起案者のユーザーマスタの承認者設定（PC持ち出し）。空なら、この段は飛ぶ
// ISMS責任者：電子申請マスタの「PC持ち出し共通承認者設定」。空の場合は、誰も承認できない申請になるので、エラーを返す
export async function buildPcApprovalSteps(
  requesterId: string
): Promise<{ steps: NewPcApprovalStep[]; error: string | null }> {
  const [settings, routes] = await Promise.all([
    prisma.userApproverSetting.findMany({
      where: { user_id: requesterId, service_type: PC_SERVICE_TYPE },
      orderBy: { step_order: "asc" },
      include: {
        position: { select: { name: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.mApprovalRoute.findMany({
      where: { service_type: PC_SERVICE_TYPE },
      orderBy: { step_order: "asc" },
      include: {
        position: { select: { name: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  const confirmerSteps: NewPcApprovalStep[] = []
  for (const s of settings) {
    if (!s.approver) {
      return { steps: [], error: "あなたの承認者設定（PC持ち出し）に、承認者が決まっていないステップがあります。ユーザーマスタで確認してください。" }
    }
    confirmerSteps.push({
      step_order: s.step_order,
      role: PC_ROLE_CONFIRMER,
      position_name: s.position?.name ?? null,
      approver_id: s.approver.id,
      approver_name: s.approver.name,
      approver_email: s.approver.email,
    })
  }

  if (routes.length === 0) {
    return { steps: [], error: "ISMS責任者が設定されていません。電子申請マスタの「PC持ち出し共通承認者設定」で設定してください。" }
  }
  const base = confirmerSteps.reduce((m, s) => Math.max(m, s.step_order), 0)
  const ismsSteps: NewPcApprovalStep[] = []
  for (const r of routes) {
    if (!r.approver) {
      return { steps: [], error: "ISMS責任者に、決まっていないステップがあります。電子申請マスタの「PC持ち出し共通承認者設定」で確認してください。" }
    }
    ismsSteps.push({
      step_order: base + Math.max(1, r.step_order),
      role: PC_ROLE_ISMS,
      position_name: r.category?.trim() || r.position?.name || null,
      approver_id: r.approver.id,
      approver_name: r.approver.name,
      approver_email: r.approver.email,
    })
  }
  return { steps: [...confirmerSteps, ...ismsSteps], error: null }
}

// 自分の番が回ってきている申請のID（自分のステップが未承認で、申請が承認中で、前の順序がすべて承認済み）。
// 一覧の「自分の承認待ち」と、電子申請トップのカードの件数は、必ずこの関数で数える
export async function findWaitingPcIds(userId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ request_id: string }[]>`
    SELECT DISTINCT s.request_id
    FROM t_pc_takeout_approval_steps s
    JOIN t_pc_takeout_requests a ON a.id = s.request_id
    WHERE s.approver_id = ${userId}
      AND s.status = '未承認'
      AND a.status IN (${PC_STATUS_CONFIRMING}, ${PC_STATUS_ISMS})
      AND NOT EXISTS (
        SELECT 1 FROM t_pc_takeout_approval_steps p
        WHERE p.request_id = s.request_id AND p.step_order < s.step_order AND p.status <> '承認済み'
      )
  `
  return rows.map(r => r.request_id)
}
