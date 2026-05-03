import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SsssDashboardClient from "./SsssDashboardClient"

export default async function SsssDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [supplyCount, holdCount, companyCount, partCount] = await Promise.all([
    prisma.sealSupply.count(),
    prisma.sealSupply.count({ where: { isHold: true } }),
    prisma.sealSupplyCompany.count({ where: { isActive: true } }),
    prisma.sealSupplyPartMaster.count({ where: { isActive: true } }),
  ])

  return (
    <SsssDashboardClient stats={{ supplyCount, holdCount, companyCount, partCount }} />
  )
}
