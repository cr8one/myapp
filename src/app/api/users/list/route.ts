import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sortByOrg } from "@/lib/user-org-sort"
export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const useOrgSort = new URL(request.url).searchParams.get("sort") === "org"
  const orderedIds = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "User" ORDER BY furigana_last_name COLLATE "und-x-icu" ASC NULLS LAST, name ASC`
  )
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      furiganaLastName: true,
      employmentType: true,
      employeeNo: true,
      positionRef: { select: { sort_order: true } },
      departments: { select: { is_primary: true, department: { select: { name: true, sort_order: true } } } },
      groups: { select: { is_primary: true, group: { select: { name: true, sort_order: true, department: { select: { name: true } } } } } },
    },
  })
  const userMap = new Map(users.map(u => [u.id, u]))
  const kanaSorted = orderedIds.map(o => userMap.get(o.id)).filter((u): u is typeof users[number] => !!u)
  const sortedUsers = useOrgSort ? sortByOrg(kanaSorted) : kanaSorted
  const result = sortedUsers.map(u => {
    const deptNames = u.departments.map(d => d.department.name)
    const groupLabels = u.groups.map(g => `${g.group.department.name} ${g.group.name}`)
    const mainDept = u.departments.find(d => d.is_primary)
    const mainGroup = u.groups.find(g => g.is_primary)
    const primaryDeptName = mainDept ? mainDept.department.name : mainGroup ? mainGroup.group.department.name : ""
    const primaryGroupName = mainGroup ? mainGroup.group.name : ""
    const primaryLabel = mainDept && mainGroup
      ? `${mainDept.department.name} ${mainGroup.group.name}`
      : mainDept
        ? mainDept.department.name
        : mainGroup
          ? `${mainGroup.group.department.name} ${mainGroup.group.name}`
          : ""
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      position: u.position,
      furiganaLastName: u.furiganaLastName,
      departmentLabels: Array.from(new Set([...deptNames, ...groupLabels])),
      primaryLabel,
      primaryDept: primaryDeptName,
      primaryGroup: primaryGroupName,
    }
  })
  return NextResponse.json(result)
}
