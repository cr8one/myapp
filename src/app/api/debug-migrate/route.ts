import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS t_cad_work_logs (
        id TEXT PRIMARY KEY,
        creator TEXT NOT NULL,
        work_date TIMESTAMP NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        request_no TEXT,
        department_group TEXT,
        person_in_charge TEXT,
        customer TEXT,
        title TEXT,
        content TEXT,
        parts_name TEXT,
        quantity INTEGER,
        paper_name TEXT,
        remarks TEXT,
        flg_same_day INTEGER NOT NULL DEFAULT 0,
        flg_del INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
