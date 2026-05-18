import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DlmsDashboardClient from "./DlmsDashboardClient"

export default async function DlmsDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [dielineCount, drawingCount] = await Promise.all([
    prisma.dlmsDielineParent.count({ where: { flg_del: 0 } }),
    prisma.drawing.count({ where: { flg_del: false } }),
  ])

  return (
    <DlmsDashboardClient
      stats={{ dielineCount, drawingCount }}
    />
  )
}
