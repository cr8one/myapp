import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function parseDate(s: string): Date | null {
  if (!s || s.trim() === "") return null
  const d = new Date(s.trim())
  return isNaN(d.getTime()) ? null : d
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.split("\n")
  for (const line of lines) {
    if (!line.trim()) continue
    const cols: string[] = []
    let current = ""
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { current += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === "," && !inQuote) {
        cols.push(current); current = ""
      } else {
        current += ch
      }
    }
    cols.push(current)
    rows.push(cols)
  }
  return rows
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as File
  if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 })

  const text = await file.text()
  // BOM除去
  const cleaned = text.replace(/^\uFEFF/, "")
  const rows = parseCSV(cleaned)
  if (rows.length < 2) return NextResponse.json({ error: "データがありません" }, { status: 400 })

  const headers = rows[0].map(h => h.trim())
  const dataRows = rows.slice(1)

  const idx = (key: string) => headers.indexOf(key)

  let created = 0, updated = 0, errors: string[] = []

  for (const row of dataRows) {
    const serialCode = row[idx("serialCode")]?.trim()
    if (!serialCode) continue

    try {
      const data = {
        issueDate: parseDate(row[idx("issueDate")]) ?? new Date(),
        productCode: row[idx("productCode")]?.trim() ?? "",
        orderNo: row[idx("orderNo")]?.trim() ?? "",
        partName: row[idx("partName")]?.trim() ?? "",
        qtyShizuokaToTokyo: parseInt(row[idx("qtyShizuokaToTokyo")]) || 0,
        qtyTokyoToOutsource: parseInt(row[idx("qtyTokyoToOutsource")]) || 0,
        qtyTokyoStock: parseInt(row[idx("qtyTokyoStock")]) || 0,
        companyName: row[idx("companyName")]?.trim() || null,
        issuerName: row[idx("issuerName")]?.trim() || null,
        supplierName: row[idx("supplierName")]?.trim() || null,
        shipDateFromJS: parseDate(row[idx("shipDateFromJS")]),
        receiverName: row[idx("receiverName")]?.trim() || null,
        receiptDateAtSupplier: parseDate(row[idx("receiptDateAtSupplier")]),
        outsourceReceiverName: row[idx("outsourceReceiverName")]?.trim() || null,
        salesDepartment: row[idx("salesDepartment")]?.trim() || null,
        salesPersonName: row[idx("salesPersonName")]?.trim() || null,
        mailSentFlag: row[idx("mailSentFlag")]?.trim() || "未",
        isHold: row[idx("isHold")]?.trim() === "1",
        holdDeadline: parseDate(row[idx("holdDeadline")]),
        notes: row[idx("notes")]?.trim() || null,
      }

      const existing = await prisma.sealSupply.findUnique({ where: { serialCode } })
      if (existing) {
        await prisma.sealSupply.update({ where: { serialCode }, data })
        updated++
      } else {
        await prisma.sealSupply.create({ data: { serialCode, ...data } })
        created++
      }
    } catch (e) {
      errors.push(`${serialCode}: ${e instanceof Error ? e.message : "エラー"}`)
    }
  }

  return NextResponse.json({ created, updated, errors })
}
