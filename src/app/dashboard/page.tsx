import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardClient from "@/components/dashboard-client"
export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.role === "ADMIN"
  const rawAnnouncements = await prisma.announcement.findMany({
    orderBy: { publishedAt: "desc" },
    take: 5,
    include: { createdBy: { select: { name: true, email: true } } },
  })
  const announcements = rawAnnouncements.map(a => ({
    ...a,
    publishedAt: a.publishedAt.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
  const permission = isAdmin ? null : await prisma.userPermission.findUnique({
    where: { userId: session.user.id },
  })
  return (
    <DashboardClient
      userName={session.user?.name ?? session.user?.email ?? ""}
      isAdmin={isAdmin}
      announcements={announcements}
      permission={permission}
    />
  )
}
