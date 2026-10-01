import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { createAuditLog } from "@/lib/audit"

const REFLECT_FIELDS: { key: "genre" | "hinmoku" | "hinban" | "title"; label: string }[] = [
  { key: "genre", label: "ジャンル" },
  { key: "hinmoku", label: "品目名" },
  { key: "hinban", label: "品番" },
  { key: "title", label: "タイトル" },
]

// 派生先 → 派生元 へ、指定した項目の値を反映する（派生元が完了でもロックの例外として許可）
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { fields } = await req.json() as { fields: string[] }

  const derived = await prisma.cadRequest.findUnique({ where: { id } })
  if (!derived) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (derived.source_type !== "派生" || !derived.source_request_id) {
    return NextResponse.json({ error: "派生元がありません" }, { status: 400 })
  }
  const source = await prisma.cadRequest.findUnique({ where: { id: derived.source_request_id } })
  if (!source) return NextResponse.json({ error: "派生元が見つかりません" }, { status: 404 })

  const data: Record<string, string | null> = {}
  const changedFields: { field: string; label: string; before: string; after: string }[] = []
  for (const f of REFLECT_FIELDS) {
    if (!fields.includes(f.key)) continue
    const before = source[f.key] ?? ""
    const after = derived[f.key] ?? ""
    if (before === after) continue
    data[f.key] = derived[f.key]
    changedFields.push({ field: f.key, label: f.label, before, after })
  }

  if (changedFields.length === 0) {
    return NextResponse.json({ error: "反映する差分がありません" }, { status: 400 })
  }

  const updated = await prisma.cadRequest.update({
    where: { id: source.id },
    data: { ...data, updated_at: new Date() },
  })

  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "UPDATE",
    targetModel: "CadRequest",
    targetId: source.id,
    targetLabel: source.uid,
    diff: { classification: "派生先から反映", changedFields },
  })
  await createAuditLog({
    userId: session.user?.id,
    service: "cad",
    action: "UPDATE",
    targetModel: "CadRequest",
    targetId: derived.id,
    targetLabel: derived.uid,
    diff: {
      classification: "派生元へ反映",
      changedFields: changedFields.map(c => ({ ...c, label: `${c.label}（派生元 ${source.uid} へ反映）` })),
    },
  })

  return NextResponse.json({ ok: true, count: changedFields.length, uid: updated.uid })
}
