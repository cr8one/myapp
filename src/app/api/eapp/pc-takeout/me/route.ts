import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/permissions"
import { getRequesterInfo } from "@/lib/accounting-slip-requester"
import { listTakeoutDevices } from "@/lib/pc-takeout-devices"

// 入力画面を開いたときの、本人の情報（氏名・所属部署・登録済みの持ち出し用端末）。メイン機が自動で入る元になる
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const info = await getRequesterInfo(user.id)
  if (!info) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const devices = await listTakeoutDevices(user.id)
  return NextResponse.json({
    name: info.name,
    department_name: info.departmentName ?? "",
    devices,
    main_device: devices.find(d => d.is_main) ?? null,
  })
}
