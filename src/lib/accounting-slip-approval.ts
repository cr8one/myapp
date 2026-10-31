import { prisma } from "@/lib/prisma"

export const STAGE_REQUESTER = "起案部"
export const STAGE_ACCOUNTING = "経理"
// 起案者ごとの承認者設定（ユーザーマスタ）のサービス名
export const REQUESTER_SETTING_SERVICE = "accounting"

export const STATUS_REQUESTER_APPROVING = "起案部承認中"
export const STATUS_ACCOUNTING_APPROVING = "経理承認中"
export const STATUS_COMPLETED = "承認完了"

export type NewApprovalStep = {
  stage: string
  step_order: number
  position_name: string | null
  approver_id: string
  approver_name: string | null
  approver_email: string
}

// 申請の時点で、承認ステップを作る。
// 起案側：起案者のユーザーマスタの承認者設定（経理精算）
// 経理側：電子申請マスタの、書類の種類ごとの共通承認者設定
// 承認者が決まっていないステップや、経理側が空の場合は、誰も承認できない伝票になるので、エラーを返す。
export async function buildApprovalSteps(
  requesterId: string,
  routeServiceType: string
): Promise<{ steps: NewApprovalStep[]; error: string | null }> {
  const [settings, routes] = await Promise.all([
    prisma.userApproverSetting.findMany({
      where: { user_id: requesterId, service_type: REQUESTER_SETTING_SERVICE },
      orderBy: { step_order: "asc" },
      include: {
        position: { select: { name: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.mApprovalRoute.findMany({
      where: { service_type: routeServiceType },
      orderBy: { step_order: "asc" },
      include: {
        position: { select: { name: true } },
        approver: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  const requesterSteps: NewApprovalStep[] = []
  for (const s of settings) {
    if (!s.approver) {
      return { steps: [], error: "あなたの承認者設定（経理精算）に、承認者が決まっていないステップがあります。ユーザーマスタで確認してください。" }
    }
    requesterSteps.push({
      stage: STAGE_REQUESTER,
      step_order: s.step_order,
      position_name: s.position?.name ?? null,
      approver_id: s.approver.id,
      approver_name: s.approver.name,
      approver_email: s.approver.email,
    })
  }

  if (routes.length === 0) {
    return { steps: [], error: "経理側の承認者が設定されていません。電子申請マスタの「経理精算共通承認者設定」で設定してください。" }
  }
  const base = requesterSteps.reduce((m, s) => Math.max(m, s.step_order), 0)
  const accountingSteps: NewApprovalStep[] = []
  for (const r of routes) {
    if (!r.approver) {
      return { steps: [], error: "経理側の承認者に、決まっていないステップがあります。電子申請マスタの「経理精算共通承認者設定」で確認してください。" }
    }
    accountingSteps.push({
      stage: STAGE_ACCOUNTING,
      step_order: base + Math.max(1, r.step_order),
      position_name: r.position?.name ?? null,
      approver_id: r.approver.id,
      approver_name: r.approver.name,
      approver_email: r.approver.email,
    })
  }
  return { steps: [...requesterSteps, ...accountingSteps], error: null }
}
