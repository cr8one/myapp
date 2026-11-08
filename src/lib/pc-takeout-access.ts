import { getSessionUser } from "@/lib/permissions"
import { PC_STATUS_DRAFT } from "@/lib/pc-takeout"

// PC持ち出し申請の閲覧制限は、このファイルの関数だけで判定する。
// 一覧・詳細・PDFなど、申請に関わるすべてのAPIは、必ずここを通すこと。
// 見られない申請は「存在しない」（404）として扱い、存在そのものを知らせない。
export type PcViewer = {
  userId: string
  name: string | null
  email: string
  canViewAll: boolean // 今は、システム管理者だけ
}

export async function getPcViewer(): Promise<PcViewer | null> {
  const user = await getSessionUser()
  if (!user) return null
  return { userId: user.id, name: user.name, email: user.email, canViewAll: user.role === "ADMIN" }
}

// 見てよい申請だけに絞る条件。
// - 起案者本人：自分の申請（下書きを含む）
// - システム管理者：下書き以外の全申請
// - 承認者：下書き以外で、その申請の承認ステップに入っているもの
export function pcVisibilityWhere(viewer: PcViewer) {
  const own = { requester_id: viewer.userId }
  if (viewer.canViewAll) {
    return { OR: [own, { status: { not: PC_STATUS_DRAFT } }] }
  }
  return {
    OR: [
      own,
      { status: { not: PC_STATUS_DRAFT }, approval_steps: { some: { approver_id: viewer.userId } } },
    ],
  }
}
