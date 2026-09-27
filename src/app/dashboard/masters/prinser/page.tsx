import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import PrinserDashboardClient from "./PrinserDashboardClient"

export default async function PrinserDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [userCount, tokuiCount, tokuiNonyuCount, trayCount] = await Promise.all([
    prisma.prinserMUser.count(),
    prisma.prinserMTokui.count(),
    prisma.prinserMTokuiNonyu.count(),
    prisma.prinserMTray.count(),
  ])

  return (
    <PrinserDashboardClient
      counts={{ userCount, tokuiCount, tokuiNonyuCount, trayCount }}
    />
  )
}
