import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DppArchiveClient from "./DppArchiveClient"

export default async function DppArchivePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.role === "ADMIN"

  return <DppArchiveClient isAdmin={isAdmin} />
}
