import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.devProject.findUnique({
    where: { id },
    include: {
      primaryCompany: true,
      companies: { include: { company: true } },
      assignees: { include: { user: { select: { id: true, name: true, department: true, position: true } } } },
    },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { title, status, description, expectedOrderDate, notes, primaryCompanyId, companyIds, assigneeIds, estimatedAmount, orderedAmount } = await req.json()
  await prisma.devProjectCompany.deleteMany({ where: { projectId: id } })
  await prisma.devProjectAssignee.deleteMany({ where: { projectId: id } })
  const project = await prisma.devProject.update({
    where: { id },
    data: {
      title,
      status,
      description,
      expectedOrderDate: expectedOrderDate ? new Date(expectedOrderDate) : null,
      notes,
      primaryCompanyId: primaryCompanyId || null,
      estimatedAmount: estimatedAmount ? parseInt(estimatedAmount) : null,
      orderedAmount: orderedAmount ? parseInt(orderedAmount) : null,
      companies: {
        create: (companyIds ?? []).map((cid: string) => ({ companyId: cid })),
      },
      assignees: {
        create: (assigneeIds ?? []).map((uid: string) => ({ userId: uid })),
      },
    },
    include: {
      primaryCompany: true,
      companies: { include: { company: true } },
      assignees: { include: { user: { select: { id: true, name: true, department: true, position: true } } } },
    },
  })
  return NextResponse.json(project)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.devProjectCompany.deleteMany({ where: { projectId: id } })
  await prisma.devProjectAssignee.deleteMany({ where: { projectId: id } })
  await prisma.devProject.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
