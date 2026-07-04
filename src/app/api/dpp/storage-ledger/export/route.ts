import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { requirePermission } from "@/lib/permissions"
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const denied = await requirePermission("dppStorageLedgerImport")
  if (denied) return denied
  const entries = await prisma.dppStorageLedgerEntry.findMany({
    orderBy: [{ storage_location: "asc" }, { hinban: "asc" }],
  })
  const header = ["保管場所", "品番", "分類"].join(",")
  const rows = entries.map(e => [
    csvEscape(e.storage_location),
    csvEscape(e.hinban),
    csvEscape(e.category ?? ""),
  ].join(","))
  const csv = "\uFEFF" + [header, ...rows].join("\r\n")
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dpp_storage_ledger_export.csv"`,
    },
  })
}
