import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await prisma.cadRequest.updateMany({
    where: { flg_del: 0 },
    data: { flg_del: 1, updated_at: new Date() },
  })

  return NextResponse.json({ ok: true, count: result.count })
}
