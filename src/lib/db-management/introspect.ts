import { prisma } from "@/lib/prisma"
import { ALLOWED_TABLE_NAMES } from "./schema-groups"

export class NotAllowedTableError extends Error {
  constructor(tableName: string) {
    super(`テーブル "${tableName}" はDB管理の許可リストに含まれていません`)
    this.name = "NotAllowedTableError"
  }
}

function assertAllowedTable(tableName: string) {
  if (!ALLOWED_TABLE_NAMES.has(tableName)) {
    throw new NotAllowedTableError(tableName)
  }
}

export type DbColumnInfo = {
  name: string
  dataType: string
  isNullable: boolean
  columnDefault: string | null
}

type RawColumnRow = {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

export async function getTableColumns(tableName: string): Promise<DbColumnInfo[]> {
  assertAllowedTable(tableName)
  const rows = await prisma.$queryRaw<RawColumnRow[]>`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${tableName}
    ORDER BY ordinal_position
  `
  return rows.map(r => ({
    name: r.column_name,
    dataType: r.data_type,
    isNullable: r.is_nullable === "YES",
    columnDefault: r.column_default,
  }))
}

export async function getTableCount(tableName: string): Promise<number> {
  assertAllowedTable(tableName)
  // テーブル名は許可リスト経由の値のみ使用可能なため、ここでの二重引用符での組み立ては安全
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM "${tableName}"`
  )
  return Number(result[0]?.count ?? 0)
}

export type PagedRecords = {
  rows: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
}

export async function getTableRecords(
  tableName: string,
  page: number = 1,
  pageSize: number = 50
): Promise<PagedRecords> {
  assertAllowedTable(tableName)
  const safePage = Math.max(1, page)
  const safePageSize = Math.min(200, Math.max(1, pageSize))
  const offset = (safePage - 1) * safePageSize

  const [rows, total] = await Promise.all([
    prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT * FROM "${tableName}" LIMIT ${safePageSize} OFFSET ${offset}`
    ),
    getTableCount(tableName),
  ])

  return { rows, total, page: safePage, pageSize: safePageSize }
}
