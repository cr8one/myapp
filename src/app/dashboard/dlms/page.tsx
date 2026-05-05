import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DlmsDashboardClient from "./DlmsDashboardClient"

export default async function DlmsDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <DlmsDashboardClient
      stats={{
        dielineCount: 0,
        drawingCount: 0,
      }}
    />
  )
}
