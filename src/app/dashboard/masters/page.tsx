import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import MastersDashboardClient from "./MastersDashboardClient"

export default async function MastersDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

const [userCount, deptCount, trayCount, prinserUserCount, prinserTokuiCount, prinserTokuiNonyuCount, prinserTrayCount] = await Promise.all([
    prisma.user.count(),
    prisma.mDepartment.count(),
    prisma.mTray.count(),
    prisma.prinserMUser.count(),
    prisma.prinserMTokui.count(),
    prisma.prinserMTokuiNonyu.count(),
    prisma.prinserMTray.count(),
  ])
  const prinserCount = prinserUserCount + prinserTokuiCount + prinserTokuiNonyuCount + prinserTrayCount
  return (
    <MastersDashboardClient
      stats={{
        userCount,
        deptCount,
        trayCount,
        prinserCount,
      }}
    />
  )
}
