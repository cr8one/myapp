import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  "作成中": [],
  "依頼済": ["作成中", "着手"],
  "着手": ["完了", "保留"],
  "完了": [],
  "保留": ["着手"],
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { status: nextStatus } = await req.json()

  const record = await prisma.cadRequest.findUnique({ where: { id } })
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowed = ALLOWED_TRANSITIONS[record.status] ?? []
  if (!allowed.includes(nextStatus)) {
    return NextResponse.json({ error: `${record.status}から${nextStatus}への変更はできません` }, { status: 400 })
  }

  const updated = await prisma.cadRequest.update({
    where: { id },
    data: { status: nextStatus, updated_at: new Date() },
  })

  if (nextStatus === "着手") {
    const now = new Date()
    await prisma.cadWorkLog.create({
      data: {
        creator: session.user?.name || "",
        work_date: now,
        start_time: now,
        request_no: record.uid,
        department_group: record.department,
        person_in_charge: record.requester_name,
        customer: record.client,
        title: record.title,
        content: record.content,
        parts_name: record.hinmoku,
        quantity: record.finish_count,
        paper_name: record.paper,
      },
    })
  }

  if (nextStatus === "完了") {
    const openLog = await prisma.cadWorkLog.findFirst({
      where: { request_no: record.uid, end_time: null },
      orderBy: { start_time: "desc" },
    })
    if (openLog) {
      await prisma.cadWorkLog.update({
        where: { id: openLog.id },
        data: { end_time: new Date() },
      })
    }
  }

  return NextResponse.json(updated)
}
