import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      departments: { select: { department: { select: { name: true } } } },
      groups: { select: { group: { select: { name: true, department: { select: { name: true } } } } } },
    },
  })
  const userMap = new Map(users.map(u => [u.id, u]))
  const sortedUsers = orderedIds.map(o => userMap.get(o.id)).filter((u): u is typeof users[number] => !!u)
  const result = sortedUsers.map(u => {
    const deptNames = u.departments.map(d => d.department.name)
    const groupLabels = u.groups.map(g => `${g.group.department.name} ${g.group.name}`)
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      position: u.position,
      furiganaLastName: u.furiganaLastName,
      departmentLabels: Array.from(new Set([...deptNames, ...groupLabels])),
    }
  })
  return NextResponse.json(result)
}
