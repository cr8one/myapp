import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ItemsDashboardClient from "./ItemsDashboardClient"

export default async function ItemsDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const trayCount = await prisma.mTray.count()

  return <ItemsDashboardClient trayCount={trayCount} />
}
