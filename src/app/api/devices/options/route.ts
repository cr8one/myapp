import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// 端末を選ぶための、軽い一覧（端末の番号・端末名・メーカーと機種名）。ログインしていれば読める
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [devices, models] = await Promise.all([
    prisma.device.findMany({
      select: { deviceId: true, deviceName: true, modelId: true },
      orderBy: { deviceName: "asc" },
    }),
    prisma.deviceModel.findMany({ select: { modelId: true, vendorName: true, modelName: true } }),
  ])
  const modelMap = new Map(models.map(m => [m.modelId, [m.vendorName, m.modelName].filter(Boolean).join(" ")]))

  return NextResponse.json(
    devices.map(d => ({
      device_id: d.deviceId,
      device_name: d.deviceName,
      model_label: d.modelId != null ? (modelMap.get(d.modelId) ?? "") : "",
    })),
  )
}
