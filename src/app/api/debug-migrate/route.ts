import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS prinser_m_users (
        uid TEXT PRIMARY KEY,
        upass TEXT,
        unm TEXT,
        ukana TEXT,
        kencd TEXT,
        biko TEXT,
        ukbn TEXT,
        ulevel TEXT,
        listflg TEXT,
        kanriuid TEXT,
        bumon_cd TEXT,
        utel TEXT,
        ufax TEXT,
        umail TEXT,
        del_flg TEXT,
        dtindt TEXT,
        dtupdt TEXT,
        kanribumon TEXT,
        jimusyo TEXT,
        gaichu_flg TEXT,
        gaichu_cd TEXT,
        "rawData" TEXT,
        "importedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
