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

  const existing = permission
    ? await prisma.userPermission.findUnique({ where: { userId: id } })
    : null

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
                ssssView:     permission.ssssView     ?? true,
                ssssEdit:     permission.ssssEdit     ?? false,
                ssssIsIssuer:            permission.ssssIsIssuer            ?? false,
                ssssIsSupplier:          permission.ssssIsSupplier          ?? false,
                ssssIsReceiver:          permission.ssssIsReceiver          ?? false,
                ssssIsOutsourceReceiver: permission.ssssIsOutsourceReceiver ?? false,
                ssssIssuerOrder:            0,
                ssssSupplierOrder:          0,
                ssssReceiverOrder:          0,
                ssssOutsourceReceiverOrder: 0,
              },
              update: {
                productsView: permission.productsView,
                productsEdit: permission.productsEdit,
                partsView:    permission.partsView,
                partsEdit:    permission.partsEdit,
                devView:      permission.devView,
                devEdit:      permission.devEdit,
                ssssView:     permission.ssssView,
                ssssEdit:     permission.ssssEdit,
                ssssIsIssuer:            permission.ssssIsIssuer,
                ssssIsSupplier:          permission.ssssIsSupplier,
                ssssIsReceiver:          permission.ssssIsReceiver,
                ssssIsOutsourceReceiver: permission.ssssIsOutsourceReceiver,
                ssssIssuerOrder:            existing?.ssssIssuerOrder            ?? 0,
                ssssSupplierOrder:          existing?.ssssSupplierOrder          ?? 0,
                ssssReceiverOrder:          existing?.ssssReceiverOrder          ?? 0,
                ssssOutsourceReceiverOrder: existing?.ssssOutsourceReceiverOrder ?? 0,
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

  // 関連レコードを先にnull化・削除してから本体を削除
  await prisma.$transaction([
    // DevProjectAssigneeの削除
    prisma.devProjectAssignee.deleteMany({ where: { userId: id } }),
    // DevExhibitionVisitorの削除
    prisma.devExhibitionVisitor.deleteMany({ where: { userId: id } }),
    // SealSupplyの各担当者フィールドをnullに
    prisma.sealSupply.updateMany({ where: { issuerId: id },            data: { issuerId: null } }),
    prisma.sealSupply.updateMany({ where: { supplierId: id },          data: { supplierId: null } }),
    prisma.sealSupply.updateMany({ where: { receiverId: id },          data: { receiverId: null } }),
    prisma.sealSupply.updateMany({ where: { outsourceReceiverId: id }, data: { outsourceReceiverId: null } }),
    prisma.sealSupply.updateMany({ where: { salesPersonId: id },       data: { salesPersonId: null } }),
    // ユーザー本体削除（UserPermissionはCascadeで自動削除）
    prisma.user.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
}
