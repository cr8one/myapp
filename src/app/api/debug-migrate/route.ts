import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS t_tray_irregular_orders (
      id TEXT NOT NULL,
      order_no TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '作成中',
      request_date TIMESTAMP(3) NOT NULL,
      title TEXT NOT NULL,
      requester_id TEXT,
      requester_name TEXT NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL,
      CONSTRAINT t_tray_irregular_orders_pkey PRIMARY KEY (id)
    );
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS t_tray_irregular_orders_order_no_key ON t_tray_irregular_orders(order_no);
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_tray_usage_plans ADD COLUMN IF NOT EXISTS irregular_order_id TEXT;
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 't_tray_usage_plans_irregular_order_id_fkey'
      ) THEN
        ALTER TABLE t_tray_usage_plans
          ADD CONSTRAINT t_tray_usage_plans_irregular_order_id_fkey
          FOREIGN KEY (irregular_order_id) REFERENCES t_tray_irregular_orders(id)
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `)
  return NextResponse.json({ ok: true })
}
