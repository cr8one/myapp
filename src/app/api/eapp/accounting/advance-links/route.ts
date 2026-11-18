import { NextRequest, NextResponse } from "next/server"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { listLinkableAdvances } from "@/lib/accounting-advance-link"

// 紐づけできる仮払金請求の一覧（自分の、承認が完了した、ほかの精算書に紐づいていないもの）。
// 編集中の精算書がすでに紐づけている請求も残すため、slip_id（編集中の精算書のID）を受け取る
export async function GET(req: NextRequest) {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const slipId = req.nextUrl.searchParams.get("slip_id")
  const rows = await listLinkableAdvances(viewer.userId, slipId || null)
  return NextResponse.json(rows)
}
