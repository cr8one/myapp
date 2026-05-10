import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
export async function GET() {
  const session = await auth()
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  if (session.user.role !== "ADMIN") return new Response(JSON.stringify({ error: "権限がありません" }), { status: 403 })
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, department: true,
      position: true, phone: true, role: true, createdAt: true, permission: true,
    },
    orderBy: { createdAt: "desc" },
  })
  const header = [
    "id", "name", "email", "department", "position", "phone", "role",
    "specView", "specEdit", "estimateView", "estimateEdit",
    "eappView", "eappEdit", "travelView", "travelEdit",
    "sopView", "sopEdit", "reportView", "reportEdit",
    "bpmsView", "bpmsEdit", "dlmsView", "dlmsEdit",
    "dppView", "dppEdit", "ssssView", "ssssEdit",
    "mastersView", "mastersEdit",
    "createdAt",
  ]
  const rows = users.map((u) => [
    u.id, u.name ?? "", u.email, u.department ?? "",
    u.position ?? "", u.phone ?? "", u.role,
    u.permission?.specView     ? "1" : "0",
    u.permission?.specEdit     ? "1" : "0",
    u.permission?.estimateView ? "1" : "0",
    u.permission?.estimateEdit ? "1" : "0",
    u.permission?.eappView     ? "1" : "0",
    u.permission?.eappEdit     ? "1" : "0",
    u.permission?.travelView   ? "1" : "0",
    u.permission?.travelEdit   ? "1" : "0",
    u.permission?.sopView      ? "1" : "0",
    u.permission?.sopEdit      ? "1" : "0",
    u.permission?.reportView   ? "1" : "0",
    u.permission?.reportEdit   ? "1" : "0",
    u.permission?.bpmsView     ? "1" : "0",
    u.permission?.bpmsEdit     ? "1" : "0",
    u.permission?.dlmsView     ? "1" : "0",
    u.permission?.dlmsEdit     ? "1" : "0",
    u.permission?.dppView      ? "1" : "0",
    u.permission?.dppEdit      ? "1" : "0",
    u.permission?.ssssView     ? "1" : "0",
    u.permission?.ssssEdit     ? "1" : "0",
    u.permission?.mastersView  ? "1" : "0",
    u.permission?.mastersEdit  ? "1" : "0",
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
