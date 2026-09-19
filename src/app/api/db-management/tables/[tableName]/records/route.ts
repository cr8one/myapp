import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getTableRecords, getPrimaryKeyColumns, updateTableRecord, deleteTableRecord, deleteAllTableRecords, NotAllowedTableError } from "@/lib/db-management/introspect"

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

async function requireSinglePk(tableName: string): Promise<string> {
  const pkColumns = await getPrimaryKeyColumns(tableName)
  if (pkColumns.length !== 1) {
    throw new Error("主キーが単一列でないテーブルは編集・削除できません")
  }
  return pkColumns[0]
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { tableName } = await params
  const { pkValue, data } = await req.json()

  try {
    const pkColumn = await requireSinglePk(tableName)
    await updateTableRecord(tableName, pkColumn, pkValue, data)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof NotAllowedTableError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error("db-management record update error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "更新に失敗しました" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { tableName } = await params
  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "true"
  const pkValue = searchParams.get("pkValue")

  try {
    if (all) {
      const count = await deleteAllTableRecords(tableName)
      return NextResponse.json({ ok: true, count })
    }
    if (!pkValue) return NextResponse.json({ error: "pkValue required" }, { status: 400 })
    const pkColumn = await requireSinglePk(tableName)
    await deleteTableRecord(tableName, pkColumn, pkValue)
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof NotAllowedTableError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error("db-management record delete error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "削除に失敗しました" }, { status: 500 })
  }
}
