import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AnnouncementsClient from "./AnnouncementsClient"

export default async function AnnouncementsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard")
  return <AnnouncementsClient />
}
