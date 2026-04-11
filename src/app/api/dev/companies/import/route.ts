import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { companies, contacts, types } = await req.json()

    // 会社をupsert
    for (const row of companies) {
      if (!row.name) continue
      await prisma.devCompany.upsert({
        where: { id: row.id ?? "" },
        update: {
          name: row.name,
          nameKana: row.nameKana || null,
          industry: row.industry || null,
          status: row.status || "登録のみ",
          postalCode: row.postalCode || null,
          address: row.address || null,
          phone: row.phone || null,
          url: row.url || null,
          notes: row.notes || null,
        },
        create: {
          name: row.name,
          nameKana: row.nameKana || null,
          industry: row.industry || null,
          status: row.status || "登録のみ",
          postalCode: row.postalCode || null,
          address: row.address || null,
          phone: row.phone || null,
          url: row.url || null,
          notes: row.notes || null,
        },
      })
    }

    // 担当者をupsert（companyIdが必須）
    for (const row of contacts) {
      if (!row.companyId || !row.name) continue
      await prisma.devCompanyContact.create({
        data: {
          companyId: row.companyId,
          name: row.name,
          nameKana: row.nameKana || null,
          email: row.email || null,
          phone: row.phone || null,
          department: row.department || null,
          position: row.position || null,
          isPrimary: row.isPrimary === "true",
          notes: row.notes || null,
        },
      })
    }

    // 種別の紐づけ
    for (const row of types) {
      if (!row.companyId || !row.typeMasterName) continue
      const master = await prisma.devCompanyTypeMaster.findUnique({
        where: { name: row.typeMasterName },
      })
      if (!master) continue
      await prisma.devCompanyType.upsert({
        where: { companyId_typeMasterId: { companyId: row.companyId, typeMasterId: master.id } },
        update: {},
        create: { companyId: row.companyId, typeMasterId: master.id },
      })
    }

    return NextResponse.json({ ok: true, message: "インポートしました" })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 })
  }
}
