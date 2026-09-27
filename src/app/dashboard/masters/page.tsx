import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DB_SERVICE_GROUPS } from "@/lib/db-management/schema-groups"
import MastersDashboardClient from "./MastersDashboardClient"

export default async function MastersDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [userCount, deptCount] = await Promise.all([
    prisma.user.count(),
    prisma.mDepartment.count(),
  ])
  const itemsTableCount = DB_SERVICE_GROUPS.find(g => g.key === "masters-items")?.tables.length ?? 0
  const prinserTableCount = DB_SERVICE_GROUPS.find(g => g.key === "prinser")?.tables.length ?? 0
  return (
    <MastersDashboardClient
      stats={{
        userCount,
        deptCount,
        itemsTableCount,
        prinserTableCount,
      }}
    />
  )
}
