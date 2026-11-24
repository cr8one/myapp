import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission, getSessionUser } from "@/lib/permissions"
import { createAuditLog } from "@/lib/audit"
import { computeResult, headerColumns, parseBody, parseHeader, toJson, totalColumns } from "@/lib/estimate/save"

// 見積書の一覧（検索・絞り込み）
export async function GET(req: NextRequest) {
  const denied = await requirePermission("estimateView")
  if (denied) return denied
  const sp = new URL(req.url).searchParams
  const q = (sp.get("q") ?? "").trim()
  const status = sp.get("status") ?? ""
  const category = sp.get("category") ?? ""
  const take = Math.min(Math.max(Number(sp.get("take") ?? 100) || 100, 1), 300)
  const skip = Math.max(Number(sp.get("skip") ?? 0) || 0, 0)

  const where = {
    deleted_flg: false,
    ...(status === "draft" ? { is_confirmed: false } : status === "confirmed" ? { is_confirmed: true } : {}),
    ...(category ? { category_id: category } : {}),
    ...(q
      ? {
          OR: [
            { estimate_no: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
            { product_code: { contains: q, mode: "insensitive" as const } },
            { customer_name: { contains: q, mode: "insensitive" as const } },
            { contact_name: { contains: q, mode: "insensitive" as const } },
            { memo: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  }
  const [rows, total] = await Promise.all([
    prisma.estimate.findMany({
      where,
      orderBy: [{ issue_date: "desc" }, { estimate_no: "desc" }],
      take,
      skip,
      select: {
        id: true,
        estimate_no: true,
        customer_name: true,
        contact_name: true,
        title: true,
        product_code: true,
        issue_date: true,
        main_qty: true,
        unit_price: true,
        amount: true,
        is_confirmed: true,
        drafter_name: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.estimate.count({ where }),
  ])
  return NextResponse.json({
    total,
    rows: rows.map(r => ({
      ...r,
      issue_date: r.issue_date.toISOString().slice(0, 10),
      unit_price: Number(r.unit_price),
    })),
  })
}

// 新規作成。番号は、見積区分の「次の番号」から振る
export async function POST(req: Request) {
  const denied = await requirePermission("estimateEdit")
  if (denied) return denied
  const b = await req.json().catch(() => null)
  const categoryId = String(b?.category_id ?? "")
  const standardId = String(b?.standard_id ?? "")
  const header = parseHeader(b?.header)
  if (typeof header === "string") return NextResponse.json({ error: header }, { status: 400 })
  const body = parseBody(b?.body)
  if (typeof body === "string") return NextResponse.json({ error: body }, { status: 400 })

  const category = await prisma.estCategory.findUnique({ where: { id: categoryId } })
  if (!category || !category.is_active) return NextResponse.json({ error: "見積区分が見つからないか、無効です" }, { status: 400 })
  const standard = await prisma.estStandard.findUnique({ where: { id: standardId } })
  if (!standard) return NextResponse.json({ error: "基準が見つかりません" }, { status: 400 })
  if (standard.is_archived) return NextResponse.json({ error: "アーカイブ済みの基準は、選べません" }, { status: 400 })

  const result = await computeResult(standardId, header, body)
  const user = await getSessionUser()
  try {
    const created = await prisma.$transaction(async tx => {
      const cat = await tx.estCategory.update({ where: { id: categoryId }, data: { next_serial: { increment: 1 } } })
      const no = `${cat.code}-${String(cat.next_serial - 1).padStart(5, "0")}`
      return tx.estimate.create({
        data: {
          estimate_no: no,
          category_id: categoryId,
          standard_id: standardId,
          ...headerColumns(header),
          related_product_codes: [],
          options: toJson(body),
          result: toJson(result),
          ...totalColumns(result),
          drafter_id: user?.id ?? null,
          drafter_name: user?.name ?? null,
        },
      })
    })
    await createAuditLog({
      userId: user?.id,
      service: "estimate",
      action: "CREATE",
      targetModel: "Estimate",
      targetId: created.id,
      targetLabel: created.estimate_no,
      diff: { title: header.title, customer_name: header.customer_name, total: result.total, amount: result.amount },
    })
    return NextResponse.json({ id: created.id, estimate_no: created.estimate_no })
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "見積番号が重複しました。見積区分の「次の番号」を確認してください" }, { status: 409 })
    }
    throw e
  }
}