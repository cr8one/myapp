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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, department, position, phone, password, role, permission } = body

  const data: Record<string, unknown> = { name, department, position, phone, role }
  if (password) {
    data.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      permission: permission
        ? {
            upsert: {
              create: {
                productsView: permission.productsView ?? true,
                productsEdit: permission.productsEdit ?? false,
                partsView:    permission.partsView    ?? true,
                partsEdit:    permission.partsEdit    ?? false,
                devView:      permission.devView      ?? true,
                devEdit:      permission.devEdit      ?? false,
              },
              update: {
                productsView: permission.productsView,
                productsEdit: permission.productsEdit,
                partsView:    permission.partsView,
                partsEdit:    permission.partsEdit,
                devView:      permission.devView,
                devEdit:      permission.devEdit,
              },
            },
          }
        : undefined,
    },
    select: userSelect,
  })
  return NextResponse.json(user)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  const { id } = await params
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
