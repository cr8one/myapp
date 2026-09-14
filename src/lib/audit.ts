import { prisma } from "@/lib/prisma"

// service には DB_SERVICE_GROUPS（src/lib/db-management/schema-groups.ts）の
// key（"dlms" / "cad" / "eapp" 等）を渡す想定。
type AuditParams = {
  userId?: string | null
  service?: string | null
  action: "CREATE" | "UPDATE" | "DELETE"
  targetModel: string
  targetId: string
  targetLabel?: string | null
  // UPDATE の場合は { before: {...}, after: {...} } の形で渡すこと。
  // CREATE の場合は作成した内容そのもの、DELETE の場合は削除前の内容を渡す想定。
  diff?: object | null
}

export async function createAuditLog(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        service: params.service ?? null,
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
