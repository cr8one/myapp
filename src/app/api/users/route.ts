import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const userSelect = {
  id: true, name: true, email: true,
  position: true, phone: true, employeeNo: true, gender: true, employmentType: true, role: true, createdAt: true, permission: true,
  departments: {
    include: { department: { select: { id: true, name: true } } },
  },
  groups: {
    include: { group: { select: { id: true, name: true } } },
  },
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { name: "asc" },
  })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  const body = await request.json()
  const { name, email, password, position, phone, employeeNo, gender, employmentType, role, permission, departments, groups } = body
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name, email, password: hashedPassword,
      position, phone, employeeNo: employeeNo || null, gender: gender || null, employmentType: employmentType || null,
      role: role ?? "USER",
      permission: {
        create: {
          specView:     permission?.specView     ?? true,
          specEdit:     permission?.specEdit     ?? false,
          estimateView: permission?.estimateView ?? true,
          estimateEdit: permission?.estimateEdit ?? false,
          eappView:     permission?.eappView     ?? true,
          eappEdit:     permission?.eappEdit     ?? false,
          travelView:   permission?.travelView   ?? true,
          travelEdit:   permission?.travelEdit   ?? false,
          sopView:      permission?.sopView      ?? true,
          sopEdit:      permission?.sopEdit      ?? false,
          reportView:   permission?.reportView   ?? true,
          reportEdit:   permission?.reportEdit   ?? false,
          bpmsView:     permission?.bpmsView     ?? true,
          bpmsEdit:     permission?.bpmsEdit     ?? false,
          dlmsView:     permission?.dlmsView     ?? true,
          dlmsEdit:     permission?.dlmsEdit     ?? false,
          dppView:      permission?.dppView      ?? true,
          dppEdit:      permission?.dppEdit      ?? false,
          ssssView:     permission?.ssssView     ?? true,
          ssssEdit:     permission?.ssssEdit     ?? false,
          mastersView:  permission?.mastersView  ?? false,
          mastersEdit:  permission?.mastersEdit  ?? false,
          cadView:      permission?.cadView      ?? true,
          cadEdit:      permission?.cadEdit      ?? false,
        },
      },
      departments: departments?.length > 0 ? {
        create: departments.map((d: { department_id: string; is_primary: boolean }) => ({
          id: crypto.randomUUID(),
          department_id: d.department_id,
          is_primary: d.is_primary,
        })),
      } : undefined,
      groups: groups?.length > 0 ? {
        create: groups.map((g: { group_id: string; is_primary: boolean }) => ({
          id: crypto.randomUUID(),
          group_id: g.group_id,
          is_primary: g.is_primary,
        })),
      } : undefined,
    },
    select: userSelect,
  })
  return NextResponse.json(user)
}
