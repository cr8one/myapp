import { prisma } from "@/lib/prisma"

type AuditParams = {
  userId?: string | null
  action: "CREATE" | "UPDATE" | "DELETE"
  targetModel: string
  targetId: string
  targetLabel?: string | null
  diff?: object | null
}

export async function createAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        targetModel: params.targetModel,
        targetId: params.targetId,
        targetLabel: params.targetLabel ?? null,
        diff: params.diff ? JSON.stringify(params.diff) : null,
      },
    })
  } catch (e) {
    console.error("AuditLog error:", e)
  }
}
