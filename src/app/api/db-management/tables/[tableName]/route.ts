import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getTableColumns, getTableCount, getPrimaryKeyColumns, NotAllowedTableError } from "@/lib/db-management/introspect"
import { getNotesForTable } from "@/lib/db-management/notes"
import { findTableLabel } from "@/lib/db-management/schema-groups"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { tableName } = await params

  try {
    const [columns, count, notes, primaryKeyColumns] = await Promise.all([
      getTableColumns(tableName),
      getTableCount(tableName),
      getNotesForTable(tableName),
      getPrimaryKeyColumns(tableName),
    ])

    return NextResponse.json({
      tableName,
      label: findTableLabel(tableName) ?? tableName,
      columns,
      count,
      tableNote: notes.tableNote,
      fieldNotes: notes.fieldNotes,
      primaryKeyColumn: primaryKeyColumns.length === 1 ? primaryKeyColumns[0] : null,
    })
  } catch (e) {
    if (e instanceof NotAllowedTableError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error("db-management table detail error:", e)
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 })
  }
}
