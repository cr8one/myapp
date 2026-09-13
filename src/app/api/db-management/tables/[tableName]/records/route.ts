import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getTableRecords, NotAllowedTableError } from "@/lib/db-management/introspect"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { tableName } = await params
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") ?? "1")
  const pageSize = Number(searchParams.get("pageSize") ?? "50")

  try {
    const result = await getTableRecords(tableName, page, pageSize)
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof NotAllowedTableError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error("db-management records error:", e)
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 })
  }
}
