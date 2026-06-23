import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { knoList } = await req.json()
  if (!Array.isArray(knoList) || knoList.length === 0) {
    return NextResponse.json({ error: "knoList required" }, { status: 400 })
  }

  const bridgeUrl = process.env.PRINSER_BRIDGE_URL
  const bridgeKey = process.env.PRINSER_BRIDGE_API_KEY
  if (!bridgeUrl || !bridgeKey) return NextResponse.json({ error: "Bridge not configured" }, { status: 500 })

  const results: { kno: string; status: string; snapshotId?: string; scheduleId?: string }[] = []

  for (const kno of knoList) {
    try {
      const res = await fetch(`${bridgeUrl}/api/template/${encodeURIComponent(kno)}`, {
        headers: {
          "X-Api-Key": bridgeKey,
          "ngrok-skip-browser-warning": "true",
        },
      })

      if (!res.ok) {
        results.push({ kno, status: "error" })
        continue
      }

      const d = await res.json()

      // スナップショット保存
      const snapshot = await prisma.dppKikanTemplateSnapshot.create({
        data: {
          kno: d.kno ?? kno,
          case_segment_id: d.case_segment_id != null ? Number(d.case_segment_id) : null,
          dtindt: d.dtindt ?? null,
          dtinman: d.dtinman ?? null,
          dtintm: d.dtintm ?? null,
          dtupdt: d.dtupdt ?? null,
          dtupman: d.dtupman ?? null,
          dtuptm: d.dtuptm ?? null,
          gyokai_cd: d.gyokai_cd != null ? Number(d.gyokai_cd) : null,
          hinsyu_grp_cd: d.hinsyu_grp_cd?.toString() ?? null,
          hondenkbn: d.hondenkbn != null ? Number(d.hondenkbn) : null,
          jt_date: d.jt_date ?? null,
          media_cd: d.media_cd != null ? Number(d.media_cd) : null,
          pp_jtflg: d.pp_jtflg != null ? Number(d.pp_jtflg) : null,
          seihin_edano: d.seihin_edano ?? null,
          seihin_oyano: d.seihin_oyano ?? null,
          seihin_syu_cd: d.seihin_syu_cd != null ? Number(d.seihin_syu_cd) : null,
          seihin_syu_detail_cd: d.seihin_syu_detail_cd != null ? Number(d.seihin_syu_detail_cd) : null,
          shikyuhin_cdrom: d.shikyuhin_cdrom != null ? Number(d.shikyuhin_cdrom) : null,
          shikyuhin_color_film: d.shikyuhin_color_film != null ? Number(d.shikyuhin_color_film) : null,
          shikyuhin_color_hansya_genko: d.shikyuhin_color_hansya_genko != null ? Number(d.shikyuhin_color_hansya_genko) : null,
          shikyuhin_mail: d.shikyuhin_mail?.toString() ?? null,
          shikyuhin_mail_nm: d.shikyuhin_mail_nm ?? null,
          shikyuhin_mo: d.shikyuhin_mo != null ? Number(d.shikyuhin_mo) : null,
          shikyuhin_monoclo_hansya_genko: d.shikyuhin_monoclo_hansya_genko?.toString() ?? null,
          shikyuhin_server: d.shikyuhin_server ?? null,
          tokuicd: d.tokuicd ?? null,
          ttl_hinmei3: d.ttl_hinmei3 ?? null,
          ttl_hinmeicode: d.ttl_hinmeicode ?? null,
          ttl_m_hinsyucd: d.ttl_m_hinsyucd?.toString() ?? null,
          ttl_m_tantocd: d.ttl_m_tantocd?.toString() ?? null,
          ttl_m_tantoname: d.ttl_m_tantoname ?? null,
          ttl_nonyudate: d.ttl_nonyudate ?? null,
          ttl_note: d.ttl_note ?? null,
          ttl_tokuname1: d.ttl_tokuname1 ?? null,
          u_id: d.u_id != null ? Number(d.u_id) : null,
          uri_yotei_date: d.uri_yotei_date ?? null,
          imported_by: session.user?.email ?? null,
        },
      })

      // schedule_no採番
      const last = await prisma.dppSchedule.findFirst({
        orderBy: { schedule_no: "desc" },
      })
      const nextNo = last
        ? String(parseInt(last.schedule_no) + 1).padStart(5, "0")
        : "00001"

      // DppSchedule自動作成（基幹由来の情報を初期値として設定）
      const schedule = await prisma.dppSchedule.create({
        data: {
          schedule_no: nextNo,
          hinban: d.seihin_oyano ? `${d.seihin_oyano}${d.seihin_edano ? `-${d.seihin_edano}` : ""}` : null,
          hinmei: d.ttl_hinmei3 ?? null,
          artist_name: d.ttl_tokuname1 ?? null,
          kosei_stage: "初校",
          nouki_date: d.ttl_nonyudate ? new Date(d.ttl_nonyudate.replace(/\//g, "-")) : null,
          progress: "入稿待ち",
          eigyo_tanto: d.ttl_m_tantoname ?? null,
          kikanSnapshotId: snapshot.id,
        },
      })

      results.push({ kno, status: "ok", snapshotId: snapshot.id, scheduleId: schedule.id })
    } catch (e) {
      console.error(e)
      results.push({ kno, status: "error" })
    }
  }

  return NextResponse.json({ ok: true, results })
}
