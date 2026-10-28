import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const manager = await prisma.mVoucherManager.findFirst({ where: { user_id: user.id, role: "管理責任者" } })
  if (!manager) return NextResponse.json({ error: "管理責任者のみ承認・却下できます" }, { status: 403 })

  const { decision, comment } = await req.json()
  if (decision !== "承認" && decision !== "却下") return NextResponse.json({ error: "承認か却下を指定してください" }, { status: 400 })

  const request = await prisma.voucherCorrectionRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (request.status !== "申請中") return NextResponse.json({ error: "申請中の依頼のみ承認・却下できます" }, { status: 400 })

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.voucherCorrectionRequest.update({
      where: { id },
      data: {
        status: decision === "承認" ? "承認済み" : "却下",
        approver_name: user.name ?? null,
        approved_at: new Date(),
        decision_comment: String(comment ?? "").trim() || null,
      },
    })
    if (request.voucher_id) {
      await tx.voucherHistory.create({
        data: {
          voucher_id: request.voucher_id,
          kind: "依頼",
          field_name: `${request.action}依頼の${decision}`,
          after_value: `依頼No.${String(request.request_no).padStart(3, "0")}`,
          actor_id: user.id,
          actor_name: user.name ?? null,
        },
      })
    }
    return r
  })
  return NextResponse.json(updated)
}
