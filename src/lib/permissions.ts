import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export type PermissionKey =
  | "specView"     | "specEdit"
  | "estimateView" | "estimateEdit"
  | "eappView"     | "eappEdit"
  | "travelView"   | "travelEdit"
  | "sopView"      | "sopEdit"
  | "reportView"   | "reportEdit"
  | "bpmsView"     | "bpmsEdit"
  | "dlmsView"     | "dlmsEdit"
  | "dppView"      | "dppEdit"
  | "ssssView"     | "ssssEdit"
  | "mastersView"  | "mastersEdit"
  | "cadView"      | "cadEdit"
  | "manufacturingView" | "manufacturingEdit"
  | "trayView"          | "trayEdit"
  | "dppStorageLedgerImport"
export async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { permission: true },
  })
  return user
}
export async function hasPermission(key: PermissionKey): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) return false
  if (user.role === "ADMIN") return true
  if (!user.permission) return false
  return user.permission[key] === true
}
export async function requirePermission(key: PermissionKey) {
  const allowed = await hasPermission(key)
  if (!allowed) {
    return new Response(JSON.stringify({ error: "権限がありません" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
  return null
}

// 購買担当（またはシステム管理者）かどうか。サービスの画面権限とは別の、担当区分のフラグ
export async function hasPurchasingAccess(): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) return false
  if (user.role === "ADMIN") return true
  return user.permission?.isPurchasingStaff === true
}
export async function requirePurchasingAccess() {
  const allowed = await hasPurchasingAccess()
  if (!allowed) {
    return new Response(JSON.stringify({ error: "購買担当者のみ操作できます" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
  return null
}
