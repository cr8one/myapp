import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { DEV_PROJECT_LABELS, logDevUpdate, logDevDelete } from "@/lib/dev-history"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await prisma.devProject.findUnique({
    where: { id },
    include: {
      primaryCompany: true,
      companies: { include: { company: true } },
      assignees: { include: { user: { select: { id: true, name: true, position: true } } } },
    },
  })
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { title, status, description, expectedOrderDate, notes, primaryCompanyId, companyIds, assigneeIds, estimatedAmount, orderedAmount } = await req.json()
  const session = await auth()
  const before = await prisma.devProject.findUnique({ where: { id }, include: { primaryCompany: { select: { name: true } } } })
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
      assignees: { include: { user: { select: { id: true, name: true, position: true } } } },
    },
  })
  if (before) {
    await logDevUpdate({
      userId: session?.user?.id, targetModel: "DevProject", targetId: id, targetLabel: project.title,
      before: { ...before, primaryCompanyName: before.primaryCompany?.name ?? null },
      after: { ...project, primaryCompanyName: project.primaryCompany?.name ?? null },
      labels: DEV_PROJECT_LABELS,
    })
  }
  return NextResponse.json(project)
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const before = await prisma.devProject.findUnique({ where: { id }, select: { title: true } })
  await prisma.devProjectCompany.deleteMany({ where: { projectId: id } })
  await prisma.devProjectAssignee.deleteMany({ where: { projectId: id } })
  await prisma.devProject.delete({ where: { id } })
  if (before) {
    await logDevDelete({ userId: session?.user?.id, targetModel: "DevProject", targetId: id, targetLabel: before.title })
  }
  return NextResponse.json({ ok: true })
}
