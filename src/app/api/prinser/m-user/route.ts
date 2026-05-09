import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get("keyword")
  const delFlg = searchParams.get("delFlg")

  const users = await prisma.prinserMUser.findMany({
    where: {
      ...(keyword ? {
        OR: [
          { uid: { contains: keyword } },
          { unm: { contains: keyword } },
          { ukana: { contains: keyword } },
          { umail: { contains: keyword } },
          { bumon_cd: { contains: keyword } },
        ]
      } : {}),
      ...(delFlg !== null && delFlg !== "" ? { del_flg: delFlg } : {}),
    },
    orderBy: { uid: "asc" },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { records } = body

  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "No records" }, { status: 400 })
  }

  let upsertCount = 0
  for (const r of records) {
    await prisma.prinserMUser.upsert({
      where: { uid: r.uid },
      update: {
        upass: r.upass ?? null,
        unm: r.unm ?? null,
        ukana: r.ukana ?? null,
        kencd: r.kencd ?? null,
        biko: r.biko ?? null,
        ukbn: r.ukbn ?? null,
        ulevel: r.ulevel ?? null,
        listflg: r.listflg ?? null,
        kanriuid: r.kanriuid ?? null,
        bumon_cd: r.bumon_cd ?? null,
        utel: r.utel ?? null,
        ufax: r.ufax ?? null,
        umail: r.umail ?? null,
        del_flg: r.del_flg ?? null,
        dtindt: r.dtindt ?? null,
        dtupdt: r.dtupdt ?? null,
        kanribumon: r.kanribumon ?? null,
        jimusyo: r.jimusyo ?? null,
        gaichu_flg: r.gaichu_flg ?? null,
        gaichu_cd: r.gaichu_cd ?? null,
        rawData: JSON.stringify(r),
      },
      create: {
        uid: r.uid,
        upass: r.upass ?? null,
        unm: r.unm ?? null,
        ukana: r.ukana ?? null,
        kencd: r.kencd ?? null,
        biko: r.biko ?? null,
        ukbn: r.ukbn ?? null,
        ulevel: r.ulevel ?? null,
        listflg: r.listflg ?? null,
        kanriuid: r.kanriuid ?? null,
        bumon_cd: r.bumon_cd ?? null,
        utel: r.utel ?? null,
        ufax: r.ufax ?? null,
        umail: r.umail ?? null,
        del_flg: r.del_flg ?? null,
        dtindt: r.dtindt ?? null,
        dtupdt: r.dtupdt ?? null,
        kanribumon: r.kanribumon ?? null,
        jimusyo: r.jimusyo ?? null,
        gaichu_flg: r.gaichu_flg ?? null,
        gaichu_cd: r.gaichu_cd ?? null,
        rawData: JSON.stringify(r),
      },
    })
    upsertCount++
  }

  return NextResponse.json({ ok: true, count: upsertCount })
}

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await prisma.prinserMUser.deleteMany({})
  return NextResponse.json({ ok: true })
}
