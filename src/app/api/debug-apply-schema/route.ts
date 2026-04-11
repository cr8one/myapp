import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Role enum の作成
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `)

    // User テーブルに role カラム追加
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User"
      ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'USER';
    `)

    // user_permissions テーブル作成
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "products_view" BOOLEAN NOT NULL DEFAULT true,
        "products_edit" BOOLEAN NOT NULL DEFAULT false,
        "parts_view" BOOLEAN NOT NULL DEFAULT true,
        "parts_edit" BOOLEAN NOT NULL DEFAULT false,
        "dev_view" BOOLEAN NOT NULL DEFAULT true,
        "dev_edit" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "user_permissions_user_id_key" UNIQUE ("user_id"),
        CONSTRAINT "user_permissions_user_id_fkey"
          FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `)

    return NextResponse.json({ success: true, message: "schema applied" })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
