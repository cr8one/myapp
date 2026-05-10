import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
const userSelect = {
  id: true, name: true, email: true, department: true,
  position: true, phone: true, role: true, createdAt: true, permission: true,
}
export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const department = searchParams.get("department")
  const users = await prisma.user.findMany({
    where: department ? { department } : undefined,
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
  const { name, email, password, department, position, phone, role, permission } = body
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name, email, password: hashedPassword,
      department, position, phone,
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
        },
      },
    },
    select: userSelect,
  })
  return NextResponse.json(user)
}
