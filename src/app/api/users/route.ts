import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const userSelect = {
  id: true,
  name: true,
  email: true,
  department: true,
  position: true,
  phone: true,
  role: true,
  createdAt: true,
  permission: true,
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
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }
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
          productsView: permission?.productsView ?? true,
          productsEdit: permission?.productsEdit ?? false,
          partsView:    permission?.partsView    ?? true,
          partsEdit:    permission?.partsEdit    ?? false,
          devView:      permission?.devView      ?? true,
          devEdit:      permission?.devEdit      ?? false,
          ssssView:     permission?.ssssView     ?? true,
          ssssEdit:     permission?.ssssEdit     ?? false,
        },
      },
    },
    select: userSelect,
  })
  return NextResponse.json(user)
}
