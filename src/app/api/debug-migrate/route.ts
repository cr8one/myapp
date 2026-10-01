import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_cad_requests ADD COLUMN IF NOT EXISTS source_request_id TEXT;
  `)
  await prisma.$executeRawUnsafe(`
    ALTER TABLE t_cad_requests ADD COLUMN IF NOT EXISTS source_type TEXT;
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS t_cad_requests_source_request_id_idx ON t_cad_requests(source_request_id);
  `)
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 't_cad_requests_source_request_id_fkey'
      ) THEN
        ALTER TABLE t_cad_requests
          ADD CONSTRAINT t_cad_requests_source_request_id_fkey
          FOREIGN KEY (source_request_id) REFERENCES t_cad_requests(id)
          ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `)
  return NextResponse.json({ ok: true })
}
