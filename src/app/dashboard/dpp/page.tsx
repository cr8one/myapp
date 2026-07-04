import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DppDashboardClient from "./DppDashboardClient"

export default async function DppDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [scheduleCount, eigyoCount, seihanCount, archiveCount] = await Promise.all([
    prisma.dppSchedule.count({ where: { flg_del: 0 } }),
    prisma.dppEigyoMaster.count(),
    prisma.dppSeihanMaster.count(),
    prisma.dppScheduleArchive.count(),
  ])

  return (
    <DppDashboardClient
      stats={{
        scheduleCount,
        masterCount: eigyoCount + seihanCount,
        archiveCount,
      }}
    />
  )
}
