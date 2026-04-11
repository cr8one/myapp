import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  if (session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "権限がありません" }), { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      position: true,
      phone: true,
      role: true,
      createdAt: true,
      permission: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const header = [
    "id", "name", "email", "department", "position", "phone", "role",
    "productsView", "productsEdit", "partsView", "partsEdit", "devView", "devEdit",
    "createdAt",
  ]

  const rows = users.map((u) => [
    u.id,
    u.name ?? "",
    u.email,
    u.department ?? "",
    u.position ?? "",
    u.phone ?? "",
    u.role,
    u.permission?.productsView ? "1" : "0",
    u.permission?.productsEdit ? "1" : "0",
    u.permission?.partsView    ? "1" : "0",
    u.permission?.partsEdit    ? "1" : "0",
    u.permission?.devView      ? "1" : "0",
    u.permission?.devEdit      ? "1" : "0",
    u.createdAt.toISOString(),
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
