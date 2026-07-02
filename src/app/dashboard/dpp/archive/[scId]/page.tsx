import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DppArchiveDetailClient from "./DppArchiveDetailClient"

export default async function DppArchiveDetailPage({
  params,
}: {
  params: Promise<{ scId: string }>
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const { scId } = await params
  const record = await prisma.dppScheduleArchive.findUnique({
    where: { sc_id: decodeURIComponent(scId) },
    include: {
      parts: {
        orderBy: [{ page: "asc" }],
      },
    },
  })

  if (!record) notFound()

  return <DppArchiveDetailClient record={JSON.parse(JSON.stringify(record))} />
}
