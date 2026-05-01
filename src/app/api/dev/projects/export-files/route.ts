import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const files = await prisma.devProjectFile.findMany({
      include: { project: { select: { id: true, title: true } } },
      orderBy: { createdAt: "asc" },
    })
    return NextResponse.json(files.map((f) => ({
      projectId: f.projectId,
      projectTitle: f.project.title,
      id: f.id,
      fileName: f.fileName,
      fileKey: f.fileKey,
      fileSize: f.fileSize,
      mimeType: f.mimeType,
      comment: f.comment ?? "",
    })))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 })
  }
}
