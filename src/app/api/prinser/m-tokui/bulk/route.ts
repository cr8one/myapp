import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { records, deleteAll } = await req.json()
  if (!records || !Array.isArray(records)) return NextResponse.json({ error: "No records" }, { status: 400 })

  if (deleteAll) {
    await prisma.prinserMTokui.deleteMany({})
  }

  await prisma.prinserMTokui.createMany({
    data: records.map((r: Record<string, string>) => ({
      tokuisaki_cd: r.tokuisaki_cd,
      siten_cd:     r.siten_cd,
      tokuicd:  r.tokuicd  || null, tokuinm:  r.tokuinm  || null,
      tokuinm2: r.tokuinm2 || null, tokuinm3: r.tokuinm3 || null,
      ryk_nm:   r.ryk_nm   || null, tokuikana: r.tokuikana || null,
      del_flg:  r.del_flg  ? parseInt(r.del_flg) : null,
      dtindt: r.dtindt || null, dtintm: r.dtintm || null,
      dtupdt: r.dtupdt || null, dtuptm: r.dtuptm || null,
      aitesaki_bumon_kanji: r.aitesaki_bumon_kanji || null,
      aitesaki_tantosya:    r.aitesaki_tantosya    || null,
      aitesaki_address1:    r.aitesaki_address1    || null,
      aitesaki_address2:    r.aitesaki_address2    || null,
      aitesaki_address3:    r.aitesaki_address3    || null,
      aitesaki_yubin_no:    r.aitesaki_yubin_no    || null,
      aitesaki_tel_no:      r.aitesaki_tel_no      || null,
      tantosya_cd:     r.tantosya_cd     || null,
      tiiki_cd:        r.tiiki_cd        || null,
      gyosyu_cd:       r.gyosyu_cd       || null,
      best_juni:       r.best_juni       || null,
      kyakusaki_bunrui: r.kyakusaki_bunrui || null,
      gaityu_bunrui:   r.gaityu_bunrui   || null,
      nokyo_kbn:       r.nokyo_kbn       || null,
      sime_date:       r.sime_date       || null,
      zei_kbn:         r.zei_kbn         || null,
      aitesaki_kbn:    r.aitesaki_kbn    || null,
      hon_kari_kbn:    r.hon_kari_kbn    || null,
      president:       r.president       || null,
      kabu:            r.kabu            || null,
      oya_tokui_cd:    r.oya_tokui_cd    || null,
      aitesaki_fax_no: r.aitesaki_fax_no || null,
      group_tokui_cd:  r.group_tokui_cd  || null,
      seikyum_cd:      r.seikyum_cd      || null,
      furikomis_cd:    r.furikomis_cd    || null,
      tmail:           r.tmail           || null,
      kagami_flg:      r.kagami_flg      || null,
      ky_mon:          r.ky_mon          || null,
      ky_dt:           r.ky_dt           || null,
      zzan_sei_flg:    r.zzan_sei_flg    || null,
      ny_houhou:       r.ny_houhou       || null,
      ny_kamoku_cd:    r.ny_kamoku_cd    || null,
      nykoza_cd:       r.nykoza_cd       || null,
      fx4_tokui_cd:    r.fx4_tokui_cd    || null,
      hasu_kbn:        r.hasu_kbn        || null,
      shohizei_kbn:    r.shohizei_kbn    || null,
      syk_yobi_flg:    r.syk_yobi_flg    || null,
      mitsumorisho_id:    r.mitsumorisho_id    || null,
      mitsumori_calc_id:  r.mitsumori_calc_id  || null,
      syukin_syubetu1: r.syukin_syubetu1 || null,
      syukin_koza1:    r.syukin_koza1    || null,
      syukin_syubetu2: r.syukin_syubetu2 || null,
      syukin_koza2:    r.syukin_koza2    || null,
      syukin_tani:     r.syukin_tani     || null,
      syukin_kingaku:  r.syukin_kingaku  || null,
      kin_hasu_kbn:    r.kin_hasu_kbn    || null,
      zei_marume_tani: r.zei_marume_tani || null,
      mototyo_vis_flg: r.mototyo_vis_flg || null,
      sony_flg:        r.sony_flg        || null,
      nohon_kensa_kikaku_id: r.nohon_kensa_kikaku_id || null,
      seikyu_kbn:          r.seikyu_kbn          || null,
      non_entertainment_flg: r.non_entertainment_flg || null,
      smc_online_flg:      r.smc_online_flg      || null,
      rawData: JSON.stringify(r),
    })),
    skipDuplicates: true,
  })

  return NextResponse.json({ ok: true, count: records.length })
}
