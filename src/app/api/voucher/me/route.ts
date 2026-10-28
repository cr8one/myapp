import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser, requirePermission } from "@/lib/permissions"

export async function GET() {
  const denied = await requirePermission("voucherView")
  if (denied) return denied
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [mainBase, approvers] = await Promise.all([
    user.mainBaseId ? prisma.mBase.findUnique({ where: { id: user.mainBaseId }, select: { name: true } }) : null,
    prisma.userApproverSetting.findMany({
      where: { user_id: user.id, service_type: "voucher" },
      orderBy: { step_order: "asc" },
      include: { approver: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({
    id: user.id,
    name: user.name,
    main_base_name: mainBase?.name ?? null,
    approvers: approvers
      .filter(a => a.step_order === 1 || a.step_order === 2)
      .map(a => ({ step_order: a.step_order, approver_name: a.approver?.name ?? null })),
  })
}
