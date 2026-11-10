import { prisma } from "@/lib/prisma"

// ユーザーの持ち出し用端末（メイン機を先頭に）。メーカー・型番は、機種マスタの「メーカー名 機種名」で作る
export type TakeoutDevice = { device_id: number; device_name: string; model_label: string; is_main: boolean }

export async function listTakeoutDevices(userId: string): Promise<TakeoutDevice[]> {
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

// 持ち出し用端末として登録されている端末かを確かめ、申請に残す端末名とメーカー・型番を、台帳から取る。
// 画面から送られてきた端末名や型番は、信用しない
export async function resolveTakeoutDevice(
  userId: string,
  deviceId: number
): Promise<{ error: string } | { device_id: number; device_name: string; model_label: string }> {
  const list = await listTakeoutDevices(userId)
  const d = list.find(x => x.device_id === deviceId)
  if (!d) {
    return { error: "この端末は、あなたの持ち出し用端末として登録されていません。システム管理者に、ユーザーマスタでの登録を依頼してください。" }
  }
  return { device_id: d.device_id, device_name: d.device_name, model_label: d.model_label }
}
