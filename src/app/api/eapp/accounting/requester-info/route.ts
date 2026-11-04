import { NextResponse } from "next/server"
import { getAccountingViewer } from "@/lib/accounting-slip-access"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"

// ログイン中の本人の、部門コードと部署名。入力画面が、開いた時点で、部署の欄に入れておくために使う
export async function GET() {
  const viewer = await getAccountingViewer()
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const info = await getRequesterInfo(viewer.userId)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ department_code: info.departmentCode, department_name: info.departmentName })
}
