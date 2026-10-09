import { auth } from "@/auth"
import { redirect } from "next/navigation"
import TrayDashboardClient from "./TrayDashboardClient"

export default async function TrayDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")
  return <TrayDashboardClient />
}
