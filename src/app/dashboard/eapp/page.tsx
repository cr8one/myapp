import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getAccountingViewer, DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { STATUS_COMPLETED, STATUS_REJECTED, findWaitingSlipIds } from "@/lib/accounting-slip-approval"
import { findWaitingPcIds } from "@/lib/pc-takeout-approval"
import { PC_STATUS_DRAFT, PC_STATUS_COMPLETED, PC_STATUS_REJECTED } from "@/lib/pc-takeout"
import EAppDashboardClient from "./EAppDashboardClient"

export default async function EAppDashboardPage() {
  const viewer = await getAccountingViewer()
  if (!viewer) redirect("/login")

  // 経理精算の件数。数え方の失敗で、トップ画面が開けなくならないよう、失敗したときは0件で表示する
  let accounting = { applied: 0, completed: 0, total: 0, waiting: 0 }
  try {
    const [applied, completed, total, waiting] = await Promise.all([
      // あなたの申請：下書き（まだ申請していない）と却下（終わった）を除く。差戻しは、直して再申請するので数える
      prisma.acctSlip.count({ where: { requester_id: viewer.userId, status: { notIn: [DRAFT_STATUS, STATUS_REJECTED] } } }),
      prisma.acctSlip.count({ where: { requester_id: viewer.userId, status: STATUS_COMPLETED } }),
      // 全体：全員の申請済みの伝票の数（数だけで、中身は見えない）
      prisma.acctSlip.count({ where: { status: { not: DRAFT_STATUS } } }),
      findWaitingSlipIds(viewer.userId).then(ids => ids.length),
    ])
    accounting = { applied, completed, total, waiting }
  } catch (e) {
    console.error("経理精算の件数の取得エラー:", e)
  }

  // PC持ち出し申請の件数。経理精算と同じ数え方。失敗したときは0件で表示する
  let pcTakeout = { applied: 0, completed: 0, total: 0, waiting: 0 }
  try {
    const [applied, completed, total, waiting] = await Promise.all([
      prisma.pcTakeoutRequest.count({ where: { requester_id: viewer.userId, status: { notIn: [PC_STATUS_DRAFT, PC_STATUS_REJECTED] } } }),
      prisma.pcTakeoutRequest.count({ where: { requester_id: viewer.userId, status: PC_STATUS_COMPLETED } }),
      prisma.pcTakeoutRequest.count({ where: { status: { not: PC_STATUS_DRAFT } } }),
      findWaitingPcIds(viewer.userId).then(ids => ids.length),
    ])
    pcTakeout = { applied, completed, total, waiting }
  } catch (e) {
    console.error("PC持ち出し申請の件数の取得エラー:", e)
  }

  return (
    <EAppDashboardClient
      stats={{
        customerCount: 0,
        ringiCount: 0,
        accounting,
        pcTakeout,
      }}
    />
  )
}
