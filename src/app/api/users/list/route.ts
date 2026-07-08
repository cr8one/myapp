import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      departments: { select: { department: { select: { name: true } } } },
      groups: { select: { group: { select: { name: true, department: { select: { name: true } } } } } },
    },
    orderBy: [{ name: "asc" }],
  })
  const result = users.map(u => {
    const deptNames = u.departments.map(d => d.department.name)
    const groupLabels = u.groups.map(g => `${g.group.department.name} ${g.group.name}`)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      position: u.position,
      departmentLabels: Array.from(new Set([...deptNames, ...groupLabels])),
    }
  })
  return NextResponse.json(result)
}
