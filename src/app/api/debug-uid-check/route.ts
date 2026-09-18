import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const total = await prisma.cadRequest.count()
  const topByStringDesc = await prisma.cadRequest.findMany({
    orderBy: { uid: "desc" },
    take: 5,
    select: { uid: true, created_at: true },
  })
  const all = await prisma.cadRequest.findMany({ select: { uid: true } })
  const numeric = all.map(r => parseInt(r.uid)).filter(n => !isNaN(n))
  const maxNumeric = numeric.length ? Math.max(...numeric) : null
  const nonNumericUids = all.filter(r => isNaN(parseInt(r.uid))).map(r => r.uid)
  const duplicates = Object.entries(
    all.reduce((acc: Record<string, number>, r) => {
      acc[r.uid] = (acc[r.uid] ?? 0) + 1
      return acc
    }, {})
  ).filter(([, count]) => count > 1)

  return NextResponse.json({
    total,
    topByStringDesc,
    maxNumeric,
    nonNumericUidsCount: nonNumericUids.length,
    nonNumericUidsSample: nonNumericUids.slice(0, 10),
    duplicates,
  })
}
