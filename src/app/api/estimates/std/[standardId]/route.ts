import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"
import { loadEstimateStd } from "@/lib/estimate/std-loader"

// 見積書の計算に使う、基準の値（引き継ぎを反映した形）
export async function GET(_req: Request, { params }: { params: Promise<{ standardId: string }> }) {
  const denied = await requirePermission("estimateView")
  if (denied) return denied
  const { standardId } = await params
  const std = await prisma.estStandard.findUnique({ where: { id: standardId }, select: { id: true } })
  if (!std) return NextResponse.json({ error: "基準が見つかりません" }, { status: 404 })
  return NextResponse.json(await loadEstimateStd(standardId))
}