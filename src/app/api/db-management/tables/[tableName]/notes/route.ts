import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { upsertTableNote, upsertFieldNote } from "@/lib/db-management/notes"
import { NotAllowedTableError } from "@/lib/db-management/introspect"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { tableName } = await params
  const body = await req.json()
  const { fieldName, note } = body as { fieldName?: string; note?: string }

  if (typeof note !== "string") {
    return NextResponse.json({ error: "noteは必須です" }, { status: 400 })
  }

  try {
    if (fieldName) {
      await upsertFieldNote(tableName, fieldName, note, session.user.id)
    } else {
      await upsertTableNote(tableName, note, session.user.id)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof NotAllowedTableError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error("db-management notes update error:", e)
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 })
  }
}
