import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import MastersDashboardClient from "./MastersDashboardClient"

export default async function MastersDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [userCount, adminCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
  ])

  return (
    <MastersDashboardClient
      stats={{
        userCount,
        adminCount,
      }}
    />
  )
}
