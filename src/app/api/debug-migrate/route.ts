import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_cad_requests (
      id              TEXT PRIMARY KEY,
      uid             TEXT UNIQUE NOT NULL,
      request_date    TIMESTAMP NOT NULL,
      request_time    TEXT NOT NULL,
      requester_id    TEXT,
      requester_name  TEXT NOT NULL,
      department      TEXT,
      content         TEXT,
      client          TEXT,
      title           TEXT,
      genre           TEXT,
      hinmoku         TEXT,
      hinban          TEXT,
      dieline_no      TEXT,
      develop_y       DOUBLE PRECISION,
      develop_x       DOUBLE PRECISION,
      paper           TEXT,
      finish_count    INT,
      desired_date    TIMESTAMP,
      desired_time    TEXT,
      tray            TEXT,
      degi_spec       TEXT,
      tray_count      INT,
      pocket          TEXT,
      remarks         TEXT,
      flg_del         INT NOT NULL DEFAULT 0,
      created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY (requester_id) REFERENCES "User"(id)
    )
  `)
  return NextResponse.json({ ok: true })
}
