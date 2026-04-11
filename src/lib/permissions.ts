import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export type PermissionKey =
  | "productsView" | "productsEdit"
  | "partsView"    | "partsEdit"
  | "devView"      | "devEdit"

// セッションからユーザーのロールと権限を取得
export async function getSessionUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { permission: true },
  })
  return user
}

// ADMIN は常に true、USER はフラグを参照
export async function hasPermission(key: PermissionKey): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) return false
  if (user.role === "ADMIN") return true
  if (!user.permission) return false
  return user.permission[key] === true
}

// API ルートで使う: 権限なければ 403 を返す用
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
