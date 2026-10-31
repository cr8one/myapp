import { getSessionUser } from "@/lib/permissions"

// 経理精算の伝票の閲覧制限は、このファイルの関数だけで判定する。
// 一覧・詳細・添付ファイル・PDFなど、伝票に関わるすべてのAPIは、必ずここを通すこと。
// 見られない伝票は「存在しない」（404）として扱い、存在そのものを知らせない。
export const DRAFT_STATUS = "下書き"

export type AccountingViewer = {
  userId: string
  name: string | null
  email: string
  canViewAll: boolean // 経理担当またはシステム管理者
}

export async function getAccountingViewer(): Promise<AccountingViewer | null> {
  const user = await getSessionUser()
  if (!user) return null
  const canViewAll = user.role === "ADMIN" || user.permission?.isAccountingStaff === true
  return { userId: user.id, name: user.name, email: user.email, canViewAll }
}

// 見てよい伝票だけに絞る条件。
// - 起案者本人：自分の伝票（下書きを含む）
// - 経理担当・システム管理者：下書き以外の全伝票
// - 承認者：下書き以外で、その伝票の承認ステップに入っているもの
// 1件を取るときは、where: { AND: [{ id }, slipVisibilityWhere(viewer)] } のように使う。
export function slipVisibilityWhere(viewer: AccountingViewer) {
  const own = { requester_id: viewer.userId }
  if (viewer.canViewAll) {
    return { OR: [own, { status: { not: DRAFT_STATUS } }] }
  }
  return {
    OR: [
      own,
      { status: { not: DRAFT_STATUS }, approval_steps: { some: { approver_id: viewer.userId } } },
    ],
  }
}
