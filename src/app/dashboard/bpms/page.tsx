import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import BpmsDashboardClient from "./BpmsDashboardClient"

export default async function BpmsDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [companyCount, projectCount, exhibitionCount, typeCount] = await Promise.all([
    prisma.devCompany.count(),
    prisma.devProject.count(),
    prisma.devExhibition.count(),
    prisma.devCompanyTypeMaster.count(),
  ])

  return (
    <BpmsDashboardClient
      stats={{
        companyCount,
        projectCount,
        exhibitionCount,
        typeCount,
      }}
    />
  )
}
