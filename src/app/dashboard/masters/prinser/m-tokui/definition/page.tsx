"use client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const COLUMNS = [
  { no: 1, name: "得意先コード（得意先コード＋支店コード）", field: "tokuicd", type: "Varchar", size: "20", null: "NOT NULL", pk: "",備考: "得意先コード＋支店コードを保持" },
  { no: 2, name: "得意先名", field: "tokuinm", type: "Varchar", size: "64", null: "NOT NULL", pk: "", 備考: "" },
  { no: 3, name: "得意先名カナ", field: "tokuikana", type: "Varchar", size: "60", null: "", pk: "", 備考: "" },
  { no: 4, name: "得意先略名", field: "ryk_nm", type: "Varchar", size: "40", null: "", pk: "", 備考: "" },
  { no: 5, name: "論理削除フラグ", field: "del_flg", type: "int", size: "", null: "NOT NULL", pk: "", 備考: "" },
  { no: 6, name: "データ作成日", field: "dtindt", type: "Varchar", size: "8", null: "NOT NULL", pk: "", 備考: "yyyymmdd" },
  { no: 7, name: "データ作成時間", field: "dtintm", type: "Varchar", size: "8", null: "NOT NULL", pk: "", 備考: "hh:mm:ss" },
  { no: 8, name: "データ更新日", field: "dtupdt", type: "Varchar", size: "8", null: "NOT NULL", pk: "", 備考: "yyyymmdd" },
  { no: 9, name: "データ更新時間", field: "dtuptm", type: "Varchar", size: "8", null: "NOT NULL", pk: "", 備考: "hh:mm:ss" },
  { no: 10, name: "得意先名2（支店名）", field: "tokuinm2", type: "Varchar", size: "64", null: "", pk: "", 備考: "" },
  { no: 11, name: "得意先名3", field: "tokuinm3", type: "Varchar", size: "64", null: "", pk: "", 備考: "" },
  { no: 12, name: "相手先部門名（漢字）", field: "aitesaki_bumon_kanji", type: "Varchar", size: "20", null: "", pk: "", 備考: "" },
  { no: 13, name: "相手先担当者（漢字）", field: "aitesaki_tantosya", type: "Varchar", size: "32", null: "", pk: "", 備考: "" },
  { no: 14, name: "相手先住所１", field: "aitesaki_address1", type: "Varchar", size: "100", null: "", pk: "", 備考: "" },
  { no: 15, name: "相手先住所２", field: "aitesaki_address2", type: "Varchar", size: "100", null: "", pk: "", 備考: "" },
  { no: 16, name: "相手先住所３", field: "aitesaki_address3", type: "Varchar", size: "20", null: "", pk: "", 備考: "" },
  { no: 17, name: "相手先郵便番号", field: "aitesaki_yubin_no", type: "Varchar", size: "8", null: "", pk: "", 備考: "" },
  { no: 18, name: "相手先電話番号", field: "aitesaki_tel_no", type: "Varchar", size: "16", null: "", pk: "", 備考: "" },
  { no: 19, name: "営業担当者コード", field: "tantosya_cd", type: "Varchar", size: "10", null: "", pk: "", 備考: "" },
  { no: 20, name: "地域コード", field: "tiiki_cd", type: "Numeric", size: "", null: "", pk: "", 備考: "" },
  { no: 21, name: "業種コード", field: "gyosyu_cd", type: "Numeric", size: "2,0", null: "", pk: "", 備考: "" },
  { no: 22, name: "ベスト順位", field: "best_juni", type: "Numeric", size: "4,0", null: "", pk: "", 備考: "" },
  { no: 23, name: "客先分類", field: "kyakusaki_bunrui", type: "Varchar", size: "1", null: "", pk: "", 備考: "" },
  { no: 24, name: "外注分類", field: "gaityu_bunrui", type: "Numeric", size: "2,0", null: "", pk: "", 備考: "" },
  { no: 25, name: "農協区分", field: "nokyo_kbn", type: "Varchar", size: "1", null: "", pk: "", 備考: "1:農協　2:農協外" },
  { no: 26, name: "締日", field: "sime_date", type: "Numeric", size: "2,0", null: "", pk: "", 備考: "" },
  { no: 27, name: "税区分", field: "zei_kbn", type: "Varchar", size: "1", null: "", pk: "", 備考: "1:内税　2:外税　3:無し" },
  { no: 28, name: "相手先区分", field: "aitesaki_kbn", type: "Varchar", size: "1", null: "", pk: "", 備考: "1:得意先　2:仕入先　3:両方　4:自社" },
  { no: 29, name: "本仮区分", field: "hon_kari_kbn", type: "Varchar", size: "1", null: "", pk: "", 備考: "0:本コード　1:仮コード" },
  { no: 30, name: "代表者", field: "president", type: "Varchar", size: "20", null: "", pk: "", 備考: "" },
  { no: 31, name: "株式公開", field: "kabu", type: "Varchar", size: "20", null: "", pk: "", 備考: "" },
  { no: 32, name: "親請求先コード", field: "oya_tokui_cd", type: "Varchar", size: "20", null: "", pk: "", 備考: "" },
  { no: 33, name: "FAX番号", field: "aitesaki_fax_no", type: "Varchar", size: "16", null: "", pk: "", 備考: "" },
  { no: 34, name: "グループコード", field: "group_tokui_cd", type: "Varchar", size: "20", null: "", pk: "", 備考: "" },
  { no: 35, name: "請求元コード", field: "seikyum_cd", type: "Numeric", size: "2", null: "", pk: "", 備考: "" },
  { no: 36, name: "振込先コード", field: "furikomis_cd", type: "Numeric", size: "2", null: "", pk: "", 備考: "" },
  { no: 37, name: "E-mail", field: "tmail", type: "Varchar", size: "30", null: "", pk: "", 備考: "" },
  { no: 38, name: "カガミ出力フラグ", field: "kagami_flg", type: "Numeric", size: "1", null: "", pk: "", 備考: "0:出力しない　1:出力する" },
  { no: 39, name: "回収予定月", field: "ky_mon", type: "Numeric", size: "2", null: "", pk: "", 備考: "" },
  { no: 40, name: "回収予定日", field: "ky_dt", type: "Numeric", size: "2", null: "", pk: "", 備考: "" },
  { no: 41, name: "前月残請求フラグ", field: "zzan_sei_flg", type: "Numeric", size: "1", null: "", pk: "", 備考: "0:請求しない　1:請求する" },
  { no: 42, name: "入金方法", field: "ny_houhou", type: "Numeric", size: "1", null: "", pk: "", 備考: "0:一括入金入力　1:受注消込入金入力" },
  { no: 52, name: "入金科目コード", field: "ny_kamoku_cd", type: "Numeric", size: "1", null: "", pk: "", 備考: "" },
  { no: 53, name: "入金口座コード", field: "nykoza_cd", type: "Numeric", size: "5", null: "", pk: "", 備考: "" },
  { no: 54, name: "得意先コード（FX4）", field: "fx4_tokui_cd", type: "Numeric", size: "6", null: "", pk: "", 備考: "" },
  { no: 55, name: "消費税端数処理", field: "hasu_kbn", type: "tinyint", size: "", null: "", pk: "", 備考: "1:四捨五入 2:切捨て 3:切り上げ" },
  { no: 56, name: "消費税単位", field: "shohizei_kbn", type: "tinyint", size: "", null: "", pk: "", 備考: "1:一括　2:伝票単位　3:明細単位" },
  { no: 57, name: "得意先コード", field: "tokuisaki_cd", type: "Varchar", size: "5", null: "", pk: "○", 備考: "" },
  { no: 58, name: "支店コード", field: "siten_cd", type: "Varchar", size: "2", null: "", pk: "○", 備考: "" },
  { no: 59, name: "出荷予備フラグ", field: "syk_yobi_flg", type: "int", size: "", null: "", pk: "", 備考: "参照 m_syk_yobi" },
  { no: 60, name: "見積書種類", field: "mitsumorisho_id", type: "int", size: "", null: "", pk: "", 備考: "" },
  { no: 61, name: "見積書計算方法", field: "mitsumori_calc_id", type: "int", size: "", null: "", pk: "", 備考: "" },
  { no: 63, name: "集金種別１", field: "syukin_syubetu1", type: "int", size: "", null: "", pk: "", 備考: "現金・振込・手形など" },
  { no: 64, name: "集金口座１", field: "syukin_koza1", type: "int", size: "", null: "", pk: "", 備考: "" },
  { no: 65, name: "集金種別２", field: "syukin_syubetu2", type: "int", size: "", null: "", pk: "", 備考: "現金・振込・手形など" },
  { no: 66, name: "集金口座２", field: "syukin_koza2", type: "int", size: "", null: "", pk: "", 備考: "" },
  { no: 67, name: "集金単位", field: "syukin_tani", type: "int", size: "", null: "", pk: "", 備考: "0:円　1:％" },
  { no: 68, name: "金額・％", field: "syukin_kingaku", type: "int", size: "", null: "", pk: "", 備考: "集金種別１にあたる金額または％の数値" },
  { no: 69, name: "金額端数処理", field: "kin_hasu_kbn", type: "tinyint", size: "", null: "", pk: "", 備考: "1:四捨五入 2:切捨て 3:切り上げ" },
  { no: 70, name: "税丸め単位", field: "zei_marume_tani", type: "tinyint", size: "", null: "", pk: "", 備考: "1:1円単位 2:10円単位 3:100円単位" },
  { no: 71, name: "元帳表示フラグ", field: "mototyo_vis_flg", type: "tinyint", size: "", null: "", pk: "", 備考: "0:表示しない 1:表示する" },
  { no: 72, name: "ソニーフラグ", field: "sony_flg", type: "tinyint", size: "", null: "", pk: "", 備考: "0:ソニーでない 1:ソニー" },
]

export default function MTokuiDefinitionPage() {
  const router = useRouter()
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />戻る
        </Button>
        <div>
          <h1 className="text-2xl font-bold">m_tokui DB定義</h1>
          <p className="text-sm text-gray-500 mt-1">PRINSER得意先マスタ（{COLUMNS.length}カラム）</p>
        </div>
      </div>
      <div className="border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm bg-white w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">NO</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">名称</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">フィールド名</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">型</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">サイズ</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">NULL</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap">PK</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">備考</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COLUMNS.map(col => (
                <tr key={col.no} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 text-center">{col.no}</td>
                  <td className="px-4 py-2.5 text-gray-800 whitespace-nowrap">{col.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-700 whitespace-nowrap">{col.field}</td>
                  <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{col.type}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-center">{col.size}</td>
                  <td className="px-4 py-2.5 text-center">
                    {col.null === "NOT NULL"
                      ? <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">NOT NULL</span>
                      : ""}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {col.pk === "○"
                      ? <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">PK</span>
                      : ""}
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{col.備考}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
