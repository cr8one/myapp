import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map((l) => l.replace(/\r$/, ""))
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim())

  return lines.slice(1).map((line) => {
    const values = line.match(/("([^"]|"")*"|[^,]*)/g) ?? []
    const record: Record<string, string> = {}
    headers.forEach((h, i) => {
      record[h] = (values[i] ?? "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()
    })
    return record
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)
  if (rows.length === 0) return NextResponse.json({ error: "データがありません" }, { status: 400 })

  const results = { created: 0, skipped: 0, errors: [] as string[] }

  for (const row of rows) {
    const email = row["email"]
    if (!email) { results.errors.push("emailなし行をスキップ"); continue }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) { results.skipped++; continue }

    try {
      // パスワード未指定の場合は初期値を自動生成
      const rawPassword = row["password"] || Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(rawPassword, 10)

      await prisma.user.create({
        data: {
          name:       row["name"]       || null,
          email,
          password:   hashedPassword,
          department: row["department"] || null,
          position:   row["position"]   || null,
          phone:      row["phone"]      || null,
          role:       row["role"] === "ADMIN" ? "ADMIN" : "USER",
          permission: {
            create: {
              productsView: row["productsView"] !== "0",
              productsEdit: row["productsEdit"] === "1",
              partsView:    row["partsView"]    !== "0",
              partsEdit:    row["partsEdit"]    === "1",
              devView:      row["devView"]      !== "0",
              devEdit:      row["devEdit"]      === "1",
            },
          },
        },
      })
      results.created++
    } catch (e) {
      results.errors.push(`${email}: ${e}`)
    }
  }

  return NextResponse.json(results)
}
