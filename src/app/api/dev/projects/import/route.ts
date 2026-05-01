import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { projects, companies, assignees, files } = await req.json()

    for (const row of projects) {
      if (!row.title) continue
      await prisma.devProject.upsert({
        where: { id: row.id ?? "" },
        update: {
          title: row.title,
          status: row.status || "商談中",
          description: row.description || null,
          expectedOrderDate: row.expectedOrderDate ? new Date(row.expectedOrderDate) : null,
          notes: row.notes || null,
          primaryCompanyId: row.primaryCompanyId || null,
          estimatedAmount: row.estimatedAmount ? parseInt(row.estimatedAmount) : null,
          orderedAmount: row.orderedAmount ? parseInt(row.orderedAmount) : null,
        },
        create: {
          id: row.id || undefined,
          title: row.title,
          status: row.status || "商談中",
          description: row.description || null,
          expectedOrderDate: row.expectedOrderDate ? new Date(row.expectedOrderDate) : null,
          notes: row.notes || null,
          primaryCompanyId: row.primaryCompanyId || null,
          estimatedAmount: row.estimatedAmount ? parseInt(row.estimatedAmount) : null,
          orderedAmount: row.orderedAmount ? parseInt(row.orderedAmount) : null,
        },
      })
    }

    for (const row of companies) {
      if (!row.projectId || !row.companyId) continue
      await prisma.devProjectCompany.upsert({
        where: { projectId_companyId: { projectId: row.projectId, companyId: row.companyId } },
        update: {},
        create: { projectId: row.projectId, companyId: row.companyId },
      })
    }

    for (const row of assignees) {
      if (!row.projectId || !row.userId) continue
      await prisma.devProjectAssignee.upsert({
        where: { projectId_userId: { projectId: row.projectId, userId: row.userId } },
        update: {},
        create: { projectId: row.projectId, userId: row.userId },
      })
    }

    for (const row of files) {
      if (!row.projectId || !row.fileKey) continue
      await prisma.devProjectFile.upsert({
        where: { id: row.id ?? "" },
        update: {
          fileName: row.fileName,
          fileKey: row.fileKey,
          fileSize: row.fileSize ? parseInt(row.fileSize) : 0,
          mimeType: row.mimeType || "application/octet-stream",
          comment: row.comment || null,
        },
        create: {
          id: row.id || undefined,
          projectId: row.projectId,
          fileName: row.fileName,
          fileKey: row.fileKey,
          fileSize: row.fileSize ? parseInt(row.fileSize) : 0,
          mimeType: row.mimeType || "application/octet-stream",
          comment: row.comment || null,
        },
      })
    }

    return NextResponse.json({ ok: true, message: `インポート完了: ${projects.length}件` })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 })
  }
}
