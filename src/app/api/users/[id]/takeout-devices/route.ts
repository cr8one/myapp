import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { requireAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

// ユーザーごとの持ち出し用端末（PC持ち出し申請で、メイン機が自動で入る）。読み出しはログイン済みなら誰でも、書き込みはシステム管理者だけ

// 例外の内容を、画面に返す（このAPIは、書き込みがシステム管理者だけ。エラーの種類と、メッセージの最後の1行だけを返す）
function errorResponse(label: string, e: any) {
  console.error(label, e)
  const last = String(e?.message ?? "").split("\n").map((s: string) => s.trim()).filter(Boolean).slice(-1)[0] ?? ""
  return NextResponse.json({ error: `${label}（${e?.code ?? e?.name ?? "不明"}）${last.slice(0, 200)}` }, { status: 500 })
}

async function listFor(userId: string) {
  const rows = await prisma.userTakeoutDevice.findMany({
    where: { user_id: userId },
    include: { device: { select: { deviceId: true, deviceName: true, modelId: true } } },
    orderBy: [{ is_main: "desc" }, { created_at: "asc" }],
  })
  const modelIds = Array.from(new Set(rows.map(r => r.device.modelId).filter((v): v is number => v != null)))
  const models = modelIds.length
    ? await prisma.deviceModel.findMany({ where: { modelId: { in: modelIds } }, select: { modelId: true, vendorName: true, modelName: true } })
    : []
  const modelMap = new Map(models.map(m => [m.modelId, [m.vendorName, m.modelName].filter(Boolean).join(" ")]))
  return rows.map(r => ({
    device_id: r.device_id,
    device_name: r.device.deviceName,
    model_label: r.device.modelId != null ? (modelMap.get(r.device.modelId) ?? "") : "",
    is_main: r.is_main,
  }))
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    return NextResponse.json(await listFor(id))
  } catch (e: any) {
    return errorResponse("持ち出し用端末の読み込みに失敗しました", e)
  }
}

// 置き換え：device_ids（端末の番号の一覧）と main_device_id（メイン機）を受け取る。
// メイン機は、一覧に含まれる端末のどれか1つ。未指定で、一覧が1台だけのときは、その端末をメイン機にする
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const denied = await requireAdmin()
  if (denied) return denied
  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const raw: unknown[] = Array.isArray(body.device_ids) ? body.device_ids : []
  const deviceIds = Array.from(new Set(raw.map(v => Number(v)).filter(n => Number.isInteger(n))))
  if (deviceIds.length > 20) return NextResponse.json({ error: "登録できる端末は、20台までです" }, { status: 400 })

  let mainId: number | null = body.main_device_id === null || body.main_device_id === undefined || body.main_device_id === "" ? null : Number(body.main_device_id)
  if (mainId !== null && !deviceIds.includes(mainId)) {
    return NextResponse.json({ error: "メイン機は、登録した端末の中から選んでください" }, { status: 400 })
  }
  if (mainId === null && deviceIds.length === 1) mainId = deviceIds[0]

  if (deviceIds.length > 0) {
    const found = await prisma.device.count({ where: { deviceId: { in: deviceIds } } })
    if (found !== deviceIds.length) return NextResponse.json({ error: "存在しない端末が含まれています" }, { status: 400 })
  }

  try {
    await prisma.$transaction([
      prisma.userTakeoutDevice.deleteMany({ where: { user_id: id } }),
      ...(deviceIds.length > 0
        ? [prisma.userTakeoutDevice.createMany({
            data: deviceIds.map(d => ({ user_id: id, device_id: d, is_main: d === mainId })),
          })]
        : []),
    ])
    return NextResponse.json(await listFor(id))
  } catch (e: any) {
    return errorResponse("保存に失敗しました", e)
  }
}
