import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { createElement } from "react"
import CadRequestPdf from "@/app/dashboard/cad/requests/pdf/CadRequestPdf"
import path from "path"
import { Font } from "@react-pdf/renderer"

Font.register({
  family: "NotoSansJP",
  src: path.join(process.cwd(), "public/NotoSansJP.otf"),
})

const n = (v: string | null | undefined) => v ?? undefined

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
      request_date: record.request_date?.toISOString() ?? undefined,
      request_time: record.request_time,
      requester_name: record.requester_name,
      department: n(record.department),
      content: n(record.content),
      client: n(record.client),
      title: n(record.title),
      genre: n(record.genre),
      hinmoku: n(record.hinmoku),
      hinban: n(record.hinban),
      dieline_no: n(record.dieline_no),
      develop_y: record.develop_y ?? undefined,
      develop_x: record.develop_x ?? undefined,
      paper: n(record.paper),
      finish_count: record.finish_count ?? undefined,
      desired_date: record.desired_date?.toISOString() ?? undefined,
      desired_time: n(record.desired_time),
      tray: n(record.tray),
      degi_spec: n(record.degi_spec),
      tray_count: record.tray_count ?? undefined,
      pocket: n(record.pocket),
      remarks: n(record.remarks),
    })
  )

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="cad-request-${record.uid}.pdf"`,
    },
  })
}
