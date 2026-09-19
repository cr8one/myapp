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

export async function getPrimaryKeyColumns(tableName: string): Promise<string[]> {
  assertAllowedTable(tableName)
  const rows = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = ${tableName} AND tc.constraint_type = 'PRIMARY KEY'
    ORDER BY kcu.ordinal_position
  `
  return rows.map(r => r.column_name)
}

export async function updateTableRecord(
  tableName: string,
  pkColumn: string,
  pkValue: string,
  data: Record<string, string | null>
): Promise<void> {
  assertAllowedTable(tableName)
  const columns = await getTableColumns(tableName)
  const columnNames = new Set(columns.map(c => c.name))
  if (!columnNames.has(pkColumn)) throw new Error("不正な主キーカラムです")
  const entries = Object.entries(data).filter(([k]) => columnNames.has(k) && k !== pkColumn)
  if (entries.length === 0) return
  const setClauses = entries.map(([k], i) => `"${k}" = $${i + 1}`).join(", ")
  const values = entries.map(([, v]) => v)
  await prisma.$executeRawUnsafe(
    `UPDATE "${tableName}" SET ${setClauses} WHERE "${pkColumn}" = $${entries.length + 1}`,
    ...values,
    pkValue
  )
}

export async function deleteTableRecord(tableName: string, pkColumn: string, pkValue: string): Promise<void> {
  assertAllowedTable(tableName)
  const columns = await getTableColumns(tableName)
  if (!columns.some(c => c.name === pkColumn)) throw new Error("不正な主キーカラムです")
  await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}" WHERE "${pkColumn}" = $1`, pkValue)
}

export async function deleteAllTableRecords(tableName: string): Promise<number> {
  assertAllowedTable(tableName)
  return await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`)
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
