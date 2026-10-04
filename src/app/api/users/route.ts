import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { orgSortKey, compareOrgKey } from "@/lib/user-org-sort"

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
          manufacturingView: permission?.manufacturingView ?? true,
          manufacturingEdit: permission?.manufacturingEdit ?? false,
          trayView:          permission?.trayView          ?? true,
          trayEdit:          permission?.trayEdit           ?? false,
          dppStorageLedgerImport: permission?.dppStorageLedgerImport ?? false,
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
