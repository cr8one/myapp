import * as XLSX from "xlsx"

export interface XlsxSheetData {
  name: string
  headers: string[]
  rows: (string | number | boolean | null)[][]
}

export function buildXlsxWorkbook(sheets: XlsxSheetData[]): Buffer {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const aoa: (string | number | boolean)[][] = [
      sheet.headers,
      ...sheet.rows.map((row) => row.map((v) => (v === null ? "" : v))),
    ]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer
}

export function readXlsxWorkbook(buf: Buffer): Record<string, Record<string, unknown>[]> {
  const wb = XLSX.read(buf, { type: "buffer" })
  const result: Record<string, Record<string, unknown>[]> = {}
  for (const sheetName of wb.SheetNames) {
    result[sheetName] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: null })
  }
  return result
}
