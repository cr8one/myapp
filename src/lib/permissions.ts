import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export type PermissionKey =
  | "productsView" | "productsEdit"
  | "partsView"    | "partsEdit"
  | "devView"      | "devEdit"

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
