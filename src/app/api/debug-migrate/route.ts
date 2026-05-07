import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dlms_dieline_parents (
        id TEXT PRIMARY KEY,
        uid_ntemp VARCHAR(10) UNIQUE NOT NULL,
        flg_del SMALLINT NOT NULL DEFAULT 0,
        kyugataban VARCHAR(4),
        genre TEXT,
        spec TEXT,
        hinmoku TEXT,
        developy DOUBLE PRECISION,
        developx DOUBLE PRECISION,
        sizey DOUBLE PRECISION,
        sizex DOUBLE PRECISION,
        widthy DOUBLE PRECISION,
        dtindt TIMESTAMP NOT NULL DEFAULT NOW(),
        dtupdt TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dlms_dieline_conditions (
        id TEXT PRIMARY KEY,
        "parentId" TEXT NOT NULL REFERENCES dlms_dieline_parents(id) ON DELETE CASCADE,
        value TEXT NOT NULL,
        "sortOrder" INT NOT NULL DEFAULT 0
      )
    `)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS dlms_dieline_children (
        id TEXT PRIMARY KEY,
        "parentId" TEXT NOT NULL REFERENCES dlms_dieline_parents(id) ON DELETE CASCADE,
        edaban TEXT NOT NULL,
        han TEXT,
        me TEXT,
        kiri TEXT,
        men TEXT,
        sizey DOUBLE PRECISION,
        sizex DOUBLE PRECISION,
        "咥え" DOUBLE PRECISION,
        location TEXT,
        dxf_filename TEXT,
        flg_del SMALLINT NOT NULL DEFAULT 0,
        dtindt TIMESTAMP NOT NULL DEFAULT NOW(),
        dtupdt TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
