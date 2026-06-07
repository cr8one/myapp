import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const userSelect = {
  id: true, name: true, email: true,
  position: true, phone: true, role: true, createdAt: true, permission: true,
  departments: {
    include: { department: { select: { id: true, name: true } } },
  },
  groups: {
    include: { group: { select: { id: true, name: true } } },
  },
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  const { id } = await params
  const body = await request.json()
  const { name, position, phone, password, role, permission, departments, groups } = body
  const data: Record<string, unknown> = { name, position, phone, role }
  if (password) data.password = await bcrypt.hash(password, 10)

  const existing = permission
    ? await prisma.userPermission.findUnique({ where: { userId: id } })
    : null

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      permission: permission ? {
        upsert: {
          create: {
            specView:     permission.specView     ?? true,
            specEdit:     permission.specEdit     ?? false,
            estimateView: permission.estimateView ?? true,
            estimateEdit: permission.estimateEdit ?? false,
            eappView:     permission.eappView     ?? true,
            eappEdit:     permission.eappEdit     ?? false,
            travelView:   permission.travelView   ?? true,
            travelEdit:   permission.travelEdit   ?? false,
            sopView:      permission.sopView      ?? true,
            sopEdit:      permission.sopEdit      ?? false,
            reportView:   permission.reportView   ?? true,
            reportEdit:   permission.reportEdit   ?? false,
            bpmsView:     permission.bpmsView     ?? true,
            bpmsEdit:     permission.bpmsEdit     ?? false,
            dlmsView:     permission.dlmsView     ?? true,
            dlmsEdit:     permission.dlmsEdit     ?? false,
            dppView:      permission.dppView      ?? true,
            dppEdit:      permission.dppEdit      ?? false,
            ssssView:     permission.ssssView     ?? true,
            ssssEdit:     permission.ssssEdit     ?? false,
            mastersView:  permission.mastersView  ?? false,
            mastersEdit:  permission.mastersEdit  ?? false,
            cadView:      permission.cadView      ?? true,
            cadEdit:      permission.cadEdit      ?? false,
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
            specView:     permission.specView,
            specEdit:     permission.specEdit,
            estimateView: permission.estimateView,
            estimateEdit: permission.estimateEdit,
            eappView:     permission.eappView,
            eappEdit:     permission.eappEdit,
            travelView:   permission.travelView,
            travelEdit:   permission.travelEdit,
            sopView:      permission.sopView,
            sopEdit:      permission.sopEdit,
            reportView:   permission.reportView,
            reportEdit:   permission.reportEdit,
            bpmsView:     permission.bpmsView,
            bpmsEdit:     permission.bpmsEdit,
            dlmsView:     permission.dlmsView,
            dlmsEdit:     permission.dlmsEdit,
            dppView:      permission.dppView,
            dppEdit:      permission.dppEdit,
            ssssView:     permission.ssssView,
            ssssEdit:     permission.ssssEdit,
            mastersView:  permission.mastersView,
            mastersEdit:  permission.mastersEdit,
            cadView:      permission.cadView,
            cadEdit:      permission.cadEdit,
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
      } : undefined,
    },
    select: userSelect,
  })

  // 部署の更新
  if (departments !== undefined) {
    await prisma.userDepartment.deleteMany({ where: { user_id: id } })
    if (departments.length > 0) {
      await prisma.userDepartment.createMany({
        data: departments.map((d: { department_id: string; is_primary: boolean }) => ({
          id: crypto.randomUUID(),
          user_id: id,
          department_id: d.department_id,
          is_primary: d.is_primary,
        })),
      })
    }
  }

  // グループの更新
  if (groups !== undefined) {
    await prisma.userGroup.deleteMany({ where: { user_id: id } })
    if (groups.length > 0) {
      await prisma.userGroup.createMany({
        data: groups.map((g: { group_id: string; is_primary: boolean }) => ({
          id: crypto.randomUUID(),
          user_id: id,
          group_id: g.group_id,
          is_primary: g.is_primary,
        })),
      })
    }
  }

  return NextResponse.json(user)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  const { id } = await params
  await prisma.$transaction([
    prisma.devProjectAssignee.deleteMany({ where: { userId: id } }),
    prisma.devExhibitionVisitor.deleteMany({ where: { userId: id } }),
    prisma.sealSupply.updateMany({ where: { issuerId: id },            data: { issuerId: null } }),
    prisma.sealSupply.updateMany({ where: { supplierId: id },          data: { supplierId: null } }),
    prisma.sealSupply.updateMany({ where: { receiverId: id },          data: { receiverId: null } }),
    prisma.sealSupply.updateMany({ where: { outsourceReceiverId: id }, data: { outsourceReceiverId: null } }),
    prisma.sealSupply.updateMany({ where: { salesPersonId: id },       data: { salesPersonId: null } }),
    prisma.user.delete({ where: { id } }),
  ])
  return NextResponse.json({ success: true })
}
