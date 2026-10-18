import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getMobileEnabledServices } from "@/lib/mobile-services"
import DashboardClient from "@/components/dashboard-client"
export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.role === "ADMIN"
  // 表示期間は日付単位で判定（日本時間の今日。DBには日付入力値がUTC 0時で保存されるため同じ形式で比較）
  const todayJst = new Date(new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }))
  const rawAnnouncements = await prisma.announcement.findMany({
    where: {
      publishedAt: { lte: todayJst },
      OR: [{ expiresAt: null }, { expiresAt: { gte: todayJst } }],
    },
    orderBy: { publishedAt: "desc" },
    take: 5,
    include: { createdBy: { select: { name: true, email: true } } },
  })
  const announcements = rawAnnouncements.map(a => ({
    ...a,
    publishedAt: a.publishedAt.toISOString(),
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
  const permission = isAdmin ? null : await prisma.userPermission.findUnique({
    where: { userId: session.user.id },
  })
  const mobileServices = await getMobileEnabledServices()
  return (
    <DashboardClient
      userName={session.user?.name ?? session.user?.email ?? ""}
      isAdmin={isAdmin}
      announcements={announcements}
      permission={permission}
      mobileServices={mobileServices}
    />
  )
}
