import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { DB_SERVICE_GROUPS } from "@/lib/db-management/schema-groups"
import { getTableCount } from "@/lib/db-management/introspect"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const groups = await Promise.all(
    DB_SERVICE_GROUPS.map(async group => {
      const tables = await Promise.all(
        group.tables.map(async t => {
          let count: number | null = null
          try {
            count = await getTableCount(t.tableName)
          } catch {
            count = null
          }
          return { ...t, count }
        })
      )
      return { key: group.key, label: group.label, tables }
    })
  )

  return NextResponse.json({ groups })
}
