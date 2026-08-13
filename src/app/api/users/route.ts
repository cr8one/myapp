import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const userSelect = {
  id: true, name: true, email: true,
  lastName: true, firstName: true, furiganaLastName: true, furiganaFirstName: true,
  position: true, positionId: true, positionRef: { select: { id: true, name: true, sort_order: true } },
  phone: true, employeeNo: true, gender: true, employmentType: true, role: true, createdAt: true, updatedAt: true, permission: true, inkanImageKey: true,
  departments: {
    include: { department: { select: { id: true, name: true, sort_order: true, base: { select: { id: true, name: true, sort_order: true } } } } },
  },
  groups: {
    include: { group: { select: { id: true, name: true, sort_order: true, base: { select: { id: true, name: true, sort_order: true } } } } },
  },
}

const LATE_EMPLOYMENT_TYPES = ["嘱託", "業務委託", "派遣", "パート"]

function orgSortKey(u: Awaited<ReturnType<typeof prisma.user.findMany<{ select: typeof userSelect }>>>[number]) {
  const noOrg = u.departments.length === 0 && u.groups.length === 0 ? 0 : 1
  const primaryDept = u.departments.find(d => d.is_primary) ?? u.departments[0]
  const primaryGroup = u.groups.find(g => g.is_primary) ?? u.groups[0]
  const deptOrder = primaryDept?.department.sort_order ?? Infinity
  const hasGroup = primaryGroup ? 1 : 0
  const groupOrder = primaryGroup?.group.sort_order ?? 0
  const employmentRank = u.employmentType && LATE_EMPLOYMENT_TYPES.includes(u.employmentType) ? 1 : 0
  const positionOrder = u.positionRef?.sort_order ?? Infinity
  const employeeNoNum = u.employeeNo && /^\d+$/.test(u.employeeNo) ? Number(u.employeeNo) : Infinity
  return [noOrg, deptOrder, hasGroup, groupOrder, employmentRank, positionOrder, employeeNoNum, u.employeeNo ?? ""] as const
}

function compareOrgKey(a: ReturnType<typeof orgSortKey>, b: ReturnType<typeof orgSortKey>) {
  for (let i = 0; i < a.length - 1; i++) {
    const av = a[i] as number, bv = b[i] as number
    if (av !== bv) return av - bv
  }
  return String(a[a.length - 1]).localeCompare(String(b[b.length - 1]))
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get("sort") ?? "org"

  const prismaOrderBy: Record<string, "asc" | "desc"> | undefined =
    sort === "email_asc" ? { email: "asc" } :
    sort === "email_desc" ? { email: "desc" } :
    sort === "created_asc" ? { createdAt: "asc" } :
    sort === "created_desc" ? { createdAt: "desc" } :
    sort === "updated_asc" ? { updatedAt: "asc" } :
    sort === "updated_desc" ? { updatedAt: "desc" } :
    undefined

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: prismaOrderBy ?? { name: "asc" },
  })

  if (!prismaOrderBy) {
    users.sort((a, b) => compareOrgKey(orgSortKey(a), orgSortKey(b)))
  }

  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  const body = await request.json()
  const { lastName, firstName, furiganaLastName, furiganaFirstName, email, password, positionId, phone, employeeNo, gender, employmentType, role, permission, departments, groups } = body
  const name = [lastName, firstName].filter(Boolean).join(" ")
  const positionMaster = positionId ? await prisma.mPosition.findUnique({ where: { id: positionId } }) : null
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name, lastName: lastName || null, firstName: firstName || null,
      furiganaLastName: furiganaLastName || null, furiganaFirstName: furiganaFirstName || null,
      position: positionMaster?.name ?? null, positionId: positionId || null,
      email, password: hashedPassword,
      phone, employeeNo: employeeNo || null, gender: gender || null, employmentType: employmentType || null,
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
