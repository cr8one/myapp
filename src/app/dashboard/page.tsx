import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const [productCount, partCount, userCount] = await Promise.all([
    prisma.product.count(),
    prisma.part.count(),
    prisma.user.count(),
  ])

  const stats = [
    { label: "製品数", value: productCount, unit: "件" },
    { label: "パーツ数", value: partCount, unit: "件" },
    { label: "ユーザー数", value: userCount, unit: "名" },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>
      <p className="mt-2 text-gray-500">ようこそ、{session.user?.name}さん！</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stat.value.toLocaleString()}
              <span className="ml-1 text-base font-normal text-gray-500">
                {stat.unit}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
