import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dlms_dieline_requests (
        id TEXT PRIMARY KEY,
        request_no TEXT UNIQUE NOT NULL,
        flg_del SMALLINT NOT NULL DEFAULT 0,
        "parentId" TEXT NOT NULL REFERENCES dlms_dieline_parents(id),
        "childId" TEXT REFERENCES dlms_dieline_children(id),
        shohin_no TEXT,
        location TEXT,
        seisan_tanto TEXT,
        use_date TIMESTAMP,
        use_time TEXT,
        request_note TEXT,
        haichi_kakunin_by TEXT,
        haichi_kakunin TEXT NOT NULL DEFAULT '未手配',
        kansei_date TIMESTAMP,
        kansei_time TEXT,
        haichi_note TEXT,
        dtindt TIMESTAMP NOT NULL DEFAULT NOW(),
        dtupdt TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
