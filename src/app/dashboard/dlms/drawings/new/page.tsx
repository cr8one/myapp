import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DrawingEditor from "./DrawingEditor"

export default async function DrawingNewPage() {
  const session = await auth()
  if (!session) redirect("/login")
  return <DrawingEditor />
}
