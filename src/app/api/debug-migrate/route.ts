import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_tray_irregular_order_steps (
      id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      stage TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      label TEXT,
      approver_user_id TEXT,
      approver_name TEXT,
      approver_email TEXT,
      status TEXT NOT NULL DEFAULT '未承認',
      approved_at TIMESTAMP(3),
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT t_tray_irregular_order_steps_pkey PRIMARY KEY (id)
    );
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 't_tray_irregular_order_steps_order_id_fkey'
      ) THEN
        ALTER TABLE t_tray_irregular_order_steps
          ADD CONSTRAINT t_tray_irregular_order_steps_order_id_fkey
          FOREIGN KEY (order_id) REFERENCES t_tray_irregular_orders(id)
          ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `)
  return NextResponse.json({ ok: true })
}
