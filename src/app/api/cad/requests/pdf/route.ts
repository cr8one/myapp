import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import CadRequestPdf from "@/app/dashboard/cad/requests/pdf/CadRequestPdf"
import { Font } from "@react-pdf/renderer"
import path from "path"

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: path.join(process.cwd(), "public/fonts/NotoSansJP-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "public/fonts/NotoSansJP-Bold.ttf"), fontWeight: "bold" },
  ],
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const record = await prisma.cadRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const buf = await renderToBuffer(
    createElement(CadRequestPdf, {
      uid: record.uid,
      request_date: record.request_date?.toISOString() ?? null,
      request_time: record.request_time,
      requester_name: record.requester_name,
      department: record.department,
      content: record.content,
      client: record.client,
      title: record.title,
      genre: record.genre,
      hinmoku: record.hinmoku,
      hinban: record.hinban,
      dieline_no: record.dieline_no,
      develop_y: record.develop_y,
      develop_x: record.develop_x,
      paper: record.paper,
      finish_count: record.finish_count,
      desired_date: record.desired_date?.toISOString() ?? null,
      desired_time: record.desired_time,
      tray: record.tray,
      degi_spec: record.degi_spec,
      tray_count: record.tray_count,
      pocket: record.pocket,
      remarks: record.remarks,
    })
  )

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cad-request-${record.uid}.pdf"`,
    },
  })
}
