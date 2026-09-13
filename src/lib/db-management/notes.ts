import { prisma } from "@/lib/prisma"
import { ALLOWED_TABLE_NAMES } from "./schema-groups"
import { NotAllowedTableError } from "./introspect"

function assertAllowedTable(tableName: string) {
  if (!ALLOWED_TABLE_NAMES.has(tableName)) {
    throw new NotAllowedTableError(tableName)
  }
}

// テーブル単位の備考は fieldName = "" で表現する
const TABLE_LEVEL_FIELD = ""

export async function getNotesForTable(tableName: string) {
  assertAllowedTable(tableName)
  const notes = await prisma.dbManagementNote.findMany({
    where: { tableName },
  })
  const tableNote = notes.find(n => n.fieldName === TABLE_LEVEL_FIELD) ?? null
  const fieldNotes: Record<string, string> = {}
  for (const n of notes) {
    if (n.fieldName !== TABLE_LEVEL_FIELD) fieldNotes[n.fieldName] = n.note
  }
  return { tableNote: tableNote?.note ?? "", fieldNotes }
}

export async function upsertTableNote(tableName: string, note: string, updatedBy?: string) {
  assertAllowedTable(tableName)
  return prisma.dbManagementNote.upsert({
    where: { tableName_fieldName: { tableName, fieldName: TABLE_LEVEL_FIELD } },
    update: { note, updatedBy },
    create: { tableName, fieldName: TABLE_LEVEL_FIELD, note, updatedBy },
  })
}

export async function upsertFieldNote(
  tableName: string,
  fieldName: string,
  note: string,
  updatedBy?: string
) {
  assertAllowedTable(tableName)
  if (fieldName === TABLE_LEVEL_FIELD) {
    throw new Error("fieldNameは空文字列にできません（テーブル単位備考と衝突するため）")
  }
  return prisma.dbManagementNote.upsert({
    where: { tableName_fieldName: { tableName, fieldName } },
    update: { note, updatedBy },
    create: { tableName, fieldName, note, updatedBy },
  })
}
