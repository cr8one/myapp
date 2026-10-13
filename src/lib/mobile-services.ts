import { prisma } from "@/lib/prisma"

// 携帯画面で利用を公開しているサービスのキー（例: "bpms"）を返す
export async function getMobileEnabledServices(): Promise<string[]> {
  const rows = await prisma.mobileServiceSetting.findMany({
    where: { enabled: true },
    select: { serviceKey: true },
  })
  return rows.map((r) => r.serviceKey)
}
