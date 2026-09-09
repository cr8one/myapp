import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { buildXlsxWorkbook } from "@/lib/xlsx-io"

export async function GET() {
  const session = await auth()
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  if (session.user.role !== "ADMIN") return new Response(JSON.stringify({ error: "権限がありません" }), { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, lastName: true, firstName: true,
      furiganaLastName: true, furiganaFirstName: true, positionId: true,
      phone: true, employeeNo: true, gender: true, employmentType: true,
      role: true, dppMember: true, shortName: true, createdAt: true,
      permission: true,
      departments: true,
      groups: true,
      approverSettingsOwned: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const usersHeader = [
    "id", "email", "lastName", "firstName", "furiganaLastName", "furiganaFirstName",
    "positionId", "phone", "employeeNo", "gender", "employmentType", "role",
    "dppMember", "shortName",
    "specView", "specEdit", "estimateView", "estimateEdit",
    "eappView", "eappEdit", "travelView", "travelEdit",
    "sopView", "sopEdit", "reportView", "reportEdit",
    "bpmsView", "bpmsEdit", "dlmsView", "dlmsEdit",
    "dppView", "dppEdit", "ssssView", "ssssEdit",
    "mastersView", "mastersEdit", "cadView", "cadEdit",
    "createdAt",
  ]
  const usersRows = users.map((u) => [
    u.id, u.email, u.lastName ?? "", u.firstName ?? "",
    u.furiganaLastName ?? "", u.furiganaFirstName ?? "", u.positionId ?? "",
    u.phone ?? "", u.employeeNo ?? "", u.gender ?? "", u.employmentType ?? "",
    u.role, u.dppMember ? "1" : "0", u.shortName ?? "",
    u.permission?.specView ? "1" : "0",
    u.permission?.specEdit ? "1" : "0",
    u.permission?.estimateView ? "1" : "0",
    u.permission?.estimateEdit ? "1" : "0",
    u.permission?.eappView ? "1" : "0",
    u.permission?.eappEdit ? "1" : "0",
    u.permission?.travelView ? "1" : "0",
    u.permission?.travelEdit ? "1" : "0",
    u.permission?.sopView ? "1" : "0",
    u.permission?.sopEdit ? "1" : "0",
    u.permission?.reportView ? "1" : "0",
    u.permission?.reportEdit ? "1" : "0",
    u.permission?.bpmsView ? "1" : "0",
    u.permission?.bpmsEdit ? "1" : "0",
    u.permission?.dlmsView ? "1" : "0",
    u.permission?.dlmsEdit ? "1" : "0",
    u.permission?.dppView ? "1" : "0",
    u.permission?.dppEdit ? "1" : "0",
    u.permission?.ssssView ? "1" : "0",
    u.permission?.ssssEdit ? "1" : "0",
    u.permission?.mastersView ? "1" : "0",
    u.permission?.mastersEdit ? "1" : "0",
    u.permission?.cadView ? "1" : "0",
    u.permission?.cadEdit ? "1" : "0",
    u.createdAt.toISOString(),
  ])

  const deptHeader = ["user_id", "department_id", "is_primary"]
  const deptRows: (string | number)[][] = []
  for (const u of users) {
    for (const d of u.departments) {
      deptRows.push([u.id, d.department_id, d.is_primary ? "1" : "0"])
    }
  }

  const groupHeader = ["user_id", "group_id", "is_primary"]
  const groupRows: (string | number)[][] = []
  for (const u of users) {
    for (const g of u.groups) {
      groupRows.push([u.id, g.group_id, g.is_primary ? "1" : "0"])
    }
  }

  const apprHeader = ["user_id", "service_type", "step_order", "position_id", "approver_user_id"]
  const apprRows: (string | number)[][] = []
  for (const u of users) {
    for (const a of u.approverSettingsOwned) {
      apprRows.push([u.id, a.service_type, a.step_order, a.position_id ?? "", a.approver_user_id ?? ""])
    }
  }

  const buf = buildXlsxWorkbook([
    { name: "Users", headers: usersHeader, rows: usersRows },
    { name: "UserDepartments", headers: deptHeader, rows: deptRows },
    { name: "UserGroups", headers: groupHeader, rows: groupRows },
    { name: "UserApproverSettings", headers: apprHeader, rows: apprRows },
  ])

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="users_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  })
}
