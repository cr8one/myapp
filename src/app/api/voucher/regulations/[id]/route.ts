import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const { id } = await params
  const record = await prisma.voucherRegulation.findUnique({
    where: { id },
    include: { files: { orderBy: { uploaded_at: "asc" } } },
  })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(record)
}
