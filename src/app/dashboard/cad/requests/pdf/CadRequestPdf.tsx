import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const F = StyleSheet.create({
  page: {
    width: "210mm",
    height: "148mm",
    padding: "4mm 5mm 3mm 5mm",
    fontFamily: "NotoSansJP",
    fontSize: 8,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "1pt solid #000",
    paddingBottom: "2mm",
    marginBottom: "2mm",
  },
  headerTitle: { fontSize: 14, fontWeight: "bold", marginRight: "4mm" },
  headerNoLabel: { fontSize: 9, marginRight: "2mm" },
  headerNoBox: { border: "1pt solid #000", width: "22mm", padding: "1mm 2mm", fontSize: 10, textAlign: "right" },
  headerDateLabel: { fontSize: 9, marginLeft: "4mm", marginRight: "2mm" },
  headerDateVal: { fontSize: 9 },
  body: { flexDirection: "row", flex: 1 },
  left: { width: "55mm", borderRight: "0.5pt solid #000", paddingRight: "2mm" },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: "1.2mm" },
  rowLabel: { width: "16mm", fontSize: 7.5, color: "#000" },
  rowVal: { flex: 1, border: "0.5pt solid #000", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5.5mm" },
  dimRow: { flexDirection: "row", alignItems: "flex-end" },
  dimBox: { border: "0.5pt solid #000", width: "16mm", padding: "0.8mm 1.5mm", fontSize: 8, textAlign: "right" },
  dimSep: { marginHorizontal: "1mm", fontSize: 8 },
  dimUnit: { fontSize: 6, color: "#555" },
  center: { width: "4mm", alignItems: "center", justifyContent: "center" },
  right: { flex: 1, paddingLeft: "2mm" },
  rightSection: { marginBottom: "2mm" },
  rightSectionTitle: { fontSize: 6.5, color: "#555", marginBottom: "1mm" },
  trayRow: { flexDirection: "row", marginBottom: "1.5mm" },
  trayBox: { flex: 2, border: "0.5pt solid #000", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "10mm", marginRight: "2mm" },
  degiBox: { width: "20mm", border: "0.5pt solid #000", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "10mm" },
  trayRow2: { flexDirection: "row", alignItems: "center", marginBottom: "2mm" },
  trayCountLabel: { fontSize: 7.5 },
  trayCountBox: { border: "0.5pt solid #000", width: "18mm", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5mm", marginLeft: "1mm", marginRight: "2mm" },
  pocketLabel: { fontSize: 7.5 },
  pocketBox: { flex: 1, border: "0.5pt solid #000", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5mm", marginLeft: "1mm" },
  remarksBox: { flex: 1, border: "0.5pt solid #000", padding: "1.5mm 2mm", fontSize: 8 },
  footer: {
    borderTop: "1pt solid #000",
    paddingTop: "1.5mm",
    marginTop: "2mm",
    flexDirection: "row",
    alignItems: "center",
  },
  footerLabel: { fontSize: 8, marginRight: "1mm" },
  footerBox: { border: "0.5pt solid #000", width: "22mm", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5mm", marginRight: "3mm" },
  footerBoxSm: { border: "0.5pt solid #000", width: "14mm", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5mm" },
  footerSep: { fontSize: 9, marginHorizontal: "1mm" },
  footerMin: { fontSize: 8, marginLeft: "1mm", marginRight: "3mm" },
  footerConfirmBox: { border: "0.5pt solid #000", width: "10mm", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5mm" },
  spacer: { flex: 1 },
})

type Props = {
  uid: string
  request_date?: string
  request_time: string
  requester_name: string
  department?: string
  content?: string
  client?: string
  title?: string
  genre?: string
  hinmoku?: string
  hinban?: string
  dieline_no?: string
  develop_y?: number
  develop_x?: number
  paper?: string
  finish_count?: number
  desired_date?: string
  desired_time?: string
  tray?: string
  degi_spec?: string
  tray_count?: number
  pocket?: string
  remarks?: string
}

function formatDate(str?: string) {
  if (!str) return ""
  const d = new Date(str)
  return `${d.getFullYear() - 2000 + 1}年${d.getMonth() + 1}月${d.getDate()}日`
}

function formatTime(t?: string) {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = parseInt(h)
  return `${hour >= 12 ? "PM" : "AM"} ${hour > 12 ? hour - 12 : hour}:${m}`
}

function formatDesiredDate(str?: string) {
  if (!str) return ""
  const d = new Date(str)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export default function CadRequestPdf(props: Props) {
  return (
    <Document>
      <Page size={[595.28, 419.53]} style={F.page}>
        {/* ヘッダー */}
        <View style={F.header}>
          <Text style={F.headerTitle}>CAD作業依頼書</Text>
          <Text style={F.headerNoLabel}>No</Text>
          <Text style={F.headerNoBox}>{props.uid}</Text>
          <Text style={F.headerDateLabel}>依頼日時</Text>
          <Text style={F.headerDateVal}>
            {formatDate(props.request_date)}　{formatTime(props.request_time)}
          </Text>
        </View>

        {/* 本体 */}
        <View style={F.body}>
          {/* 左カラム */}
          <View style={F.left}>
            <View style={F.row}>
              <Text style={F.rowLabel}>部署</Text>
              <Text style={F.rowVal}>{props.department ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>営業担当</Text>
              <Text style={F.rowVal}>{props.requester_name}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>クライアント</Text>
              <Text style={F.rowVal}>{props.client ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>タイトル</Text>
              <Text style={F.rowVal}>{props.title ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>依頼内容</Text>
              <Text style={F.rowVal}>{props.content ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>ジャンル</Text>
              <Text style={{ ...F.rowVal, textAlign: "center" }}>{props.genre ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>品目名</Text>
              <Text style={F.rowVal}>{props.hinmoku ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>品番</Text>
              <Text style={F.rowVal}>{props.hinban ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>型台帳番号</Text>
              <Text style={F.rowVal}>{props.dieline_no ?? ""}</Text>
            </View>
            <View style={{ ...F.row, alignItems: "flex-end" }}>
              <Text style={F.rowLabel}>展開寸法</Text>
              <View style={F.dimRow}>
                <View>
                  <Text style={F.dimBox}>{props.develop_y ?? ""}</Text>
                  <Text style={F.dimUnit}>　mm</Text>
                </View>
                <Text style={F.dimSep}>×</Text>
                <View>
                  <Text style={F.dimBox}>{props.develop_x ?? ""}</Text>
                  <Text style={F.dimUnit}>　mm</Text>
                </View>
              </View>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>用紙</Text>
              <Text style={F.rowVal}>{props.paper ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>仕上個数</Text>
              <Text style={{ ...F.rowVal, textAlign: "center" }}>{props.finish_count ?? ""}</Text>
            </View>
            <View style={F.row}>
              <Text style={F.rowLabel}>希望納期</Text>
              <Text style={F.rowVal}>
                {formatDesiredDate(props.desired_date)}{props.desired_time ? `　${props.desired_time}` : ""}
              </Text>
            </View>
          </View>

          {/* 中央ファイリングライン */}
          <View style={F.center}>
            <Text style={{ fontSize: 7, color: "#aaa" }}>▽</Text>
          </View>

          {/* 右カラム */}
          <View style={F.right}>
            <View style={F.rightSection}>
              <Text style={F.rightSectionTitle}>トレイ仕様詳細</Text>
              <View style={F.trayRow}>
                <View style={{ flex: 1, marginRight: "2mm" }}>
                  <Text style={[F.rightSectionTitle, { marginBottom: "0.5mm" }]}>使用トレイ</Text>
                  <Text style={F.trayBox}>{props.tray ?? ""}</Text>
                </View>
                <View style={{ width: "20mm" }}>
                  <Text style={[F.rightSectionTitle, { marginBottom: "0.5mm" }]}>デジ仕様</Text>
                  <Text style={F.degiBox}>{props.degi_spec ?? ""}</Text>
                </View>
              </View>
              <View style={F.trayRow2}>
                <Text style={F.trayCountLabel}>トレイ枚数</Text>
                <Text style={F.trayCountBox}>{props.tray_count ?? ""}</Text>
                <Text style={F.pocketLabel}>ポケット</Text>
                <Text style={F.pocketBox}>{props.pocket ?? ""}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={F.rightSectionTitle}>詳細記入欄</Text>
              <Text style={F.remarksBox}>{props.remarks ?? ""}</Text>
            </View>
          </View>
        </View>

        {/* フッター */}
        <View style={F.footer}>
          <Text style={F.footerLabel}>作業担当</Text>
          <Text style={F.footerBox}></Text>
          <Text style={F.footerLabel}>作業時間</Text>
          <Text style={F.footerBoxSm}></Text>
          <Text style={F.footerSep}>〜</Text>
          <Text style={F.footerBoxSm}></Text>
          <Text style={F.footerMin}>分</Text>
          <View style={F.spacer} />
          <Text style={F.footerLabel}>終了確認</Text>
          <Text style={F.footerConfirmBox}></Text>
        </View>
      </Page>
    </Document>
  )
}
