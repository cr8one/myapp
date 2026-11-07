import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logDevCreate } from "@/lib/dev-history"

export async function GET() {
  const projects = await prisma.devProject.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      primaryCompany: true,
      companies: { include: { company: true } },
    },
  })
  return NextResponse.json(projects)
}

export async function POST(req: Request) {
  const { title, status, description, expectedOrderDate, notes, primaryCompanyId, companyIds } = await req.json()
  if (!title) return NextResponse.json({ error: "案件名は必須です" }, { status: 400 })
  const project = await prisma.devProject.create({
    data: {
      title,
      status: status ?? "商談中",
      description,
      expectedOrderDate: expectedOrderDate ? new Date(expectedOrderDate) : null,
      notes,
      primaryCompanyId: primaryCompanyId || null,
      companies: {
        create: (companyIds ?? []).map((cid: string) => ({ companyId: cid })),
      },
    },
    include: {
      primaryCompany: true,
      companies: { include: { company: true } },
    },
  })
  const session = await auth()
  await logDevCreate({ userId: session?.user?.id, targetModel: "DevProject", targetId: project.id, targetLabel: project.title })
  return NextResponse.json(project)
}
