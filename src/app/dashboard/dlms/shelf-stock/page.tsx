import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ShelfStockClient from "./ShelfStockClient"

export default async function ShelfStockPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.role === "ADMIN"
  return <ShelfStockClient isAdmin={isAdmin} />
}
