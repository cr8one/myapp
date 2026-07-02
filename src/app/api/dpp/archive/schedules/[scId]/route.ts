import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { scId } = await params

  const record = await prisma.dppScheduleArchive.findUnique({
    where: { sc_id: scId },
    include: {
      parts: {
        orderBy: [{ page: "asc" }],
      },
    },
  })

  if (!record) return NextResponse.json({ error: "Not Found" }, { status: 404 })
  return NextResponse.json(record)
}
