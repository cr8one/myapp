import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SystemDashboardClient from "./SystemDashboardClient"
import { ALLOWED_TABLE_NAMES } from "@/lib/db-management/schema-groups"

export default async function SystemDashboardPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [devLogCount, loginLogCount, loginFailCount, auditLogCount] = await Promise.all([
    prisma.devLog.count(),
    prisma.loginLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.loginLog.count({ where: { status: "failed", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.auditLog.count(),
  ])

  const dbTableCount = ALLOWED_TABLE_NAMES.size

  return (
    <SystemDashboardClient
      stats={{ devLogCount, loginLogCount, loginFailCount, auditLogCount, dbTableCount }}
    />
  )
}
