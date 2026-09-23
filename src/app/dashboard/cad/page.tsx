import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import CadDashboardClient from "./CadDashboardClient"

export default async function CadDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [cadRequestCount, dxfRequestCount, daishiDbCount, workLogCount] = await Promise.all([
    prisma.cadRequest.count({ where: { flg_del: 0 } }),
    prisma.dxfRequest.count({ where: { flg_del: 0 } }),
    prisma.daishiDb.count({ where: { flg_del: 0 } }),
    prisma.cadWorkLog.count(),
  ])

  return (
    <CadDashboardClient
      stats={{ cadRequestCount, dxfRequestCount, daishiDbCount, workLogCount }}
    />
  )
}