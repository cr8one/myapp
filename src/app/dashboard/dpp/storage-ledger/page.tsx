import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import StorageLedgerClient from "./StorageLedgerClient"
export default async function StorageLedgerPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const [canImport, total] = await Promise.all([
    hasPermission("dppStorageLedgerImport"),
    prisma.dppStorageLedgerEntry.count(),
  ])
  return <StorageLedgerClient canImport={canImport} initialTotal={total} />
}
