"use client"
import { useEffect } from "react"
import { usePDF, Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer"

Font.register({
  family: "NotoSansJP",
  src: "/NotoSansJP.otf",
})

const S = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", paddingTop: "15mm", paddingBottom: "15mm", paddingLeft: "15mm", paddingRight: "15mm", fontSize: 9, flexDirection: "column" },
  half: { flex: 1, flexDirection: "column" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  companyName: { fontSize: 13, fontWeight: "bold" },
  honorific: { fontSize: 11, fontWeight: "bold" },
  headerLine: { borderBottomWidth: 2, borderBottomColor: "#000", borderBottomStyle: "solid", width: 130, marginTop: 3 },
  serialBlock: { alignItems: "flex-end" },
  serialCode: { fontSize: 11, fontWeight: "bold" },
  intro: { marginBottom: 10, fontSize: 9 },
  // テーブル
  table: { marginBottom: 10, borderTopWidth: 1, borderTopColor: "#888", borderTopStyle: "solid", borderLeftWidth: 1, borderLeftColor: "#888", borderLeftStyle: "solid" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#888", borderBottomStyle: "solid" },
  tableLabel: { width: 85, backgroundColor: "#f3f3f3", borderRightWidth: 1, borderRightColor: "#888", borderRightStyle: "solid", padding: 5, textAlign: "center" },
  tableValue: { flex: 1, padding: 5 },
  tableSplitLeft: { flex: 1, borderRightWidth: 1, borderRightColor: "#888", borderRightStyle: "solid", padding: 5 },
  tableSplitRight: { flex: 1, padding: 5 },
  // ロゴエリア
  logoArea: { alignItems: "flex-end", marginTop: 4 },
  logoImg: { width: 120, height: 18, objectFit: "contain" },
  supplierLine: { fontSize: 9, textAlign: "right", marginTop: 3 },
  // キリトリ
  cutArea: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  cutLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#aaa", borderBottomStyle: "dashed" },
  cutText: { fontSize: 7, color: "#aaa", marginHorizontal: 6 },
  // 受領書
  receiptLogoArea: { marginBottom: 6 },
  receiptNameLine: { flexDirection: "row", alignItems: "flex-end", borderBottomWidth: 1, borderBottomColor: "#000", borderBottomStyle: "solid", width: 140, marginTop: 2 },
  receiptName: { fontSize: 11, fontWeight: "bold" },
  receiptSuffix: { fontSize: 9, marginLeft: 4, marginBottom: 1 },
  // 右下
  rightAlign: { alignItems: "flex-end", marginTop: 4 },
  destCompany: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  signTable: { borderTopWidth: 1, borderTopColor: "#888", borderTopStyle: "solid", borderLeftWidth: 1, borderLeftColor: "#888", borderLeftStyle: "solid" },
  signRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#888", borderBottomStyle: "solid" },
  signLabel: { width: 45, backgroundColor: "#f3f3f3", borderRightWidth: 1, borderRightColor: "#888", borderRightStyle: "solid", padding: 5, fontSize: 8 },
  signValue: { width: 110, padding: 5 },
})

type PdfData = {
  serialCode: string
  issueDate: string
  productCode: string
  orderNo: string
  partName: string
  qty: number
  companyName: string
  supplierName: string
  salesDepartment: string
  salesPersonName: string
}

function DataTable({ rows, salesDept, salesPerson }: {
  rows: { label: string; value: string }[]
  salesDept: string
  salesPerson: string
}) {
  return (
    <View style={S.table}>
      {rows.map(({ label, value }) => (
        <View key={label} style={S.tableRow}>
          <Text style={S.tableLabel}>{label}</Text>
          <Text style={S.tableValue}>{value}</Text>
        </View>
      ))}
      <View style={S.tableRow}>
        <Text style={S.tableLabel}>JS営業担当者</Text>
        <Text style={S.tableSplitLeft}>{salesDept}</Text>
        <Text style={S.tableSplitRight}>{salesPerson}</Text>
      </View>
    </View>
  )
}

function SlipDocument({ data }: { data: PdfData }) {
  const rows = [
    { label: "品　番", value: data.productCode },
    { label: "受注ＮＯ", value: data.orderNo },
    { label: "貼り付けパーツ", value: data.partName },
    { label: "支給枚数", value: `${data.qty}　枚` },
  ]

  return (
    <Document>
      <Page size="A4" style={S.page}>

        {/* 上半分：送り状 */}
        <View style={S.half}>
          <View style={S.header}>
            <View>
              <Text style={S.companyName}>{data.companyName}</Text>
              <Text style={S.honorific}>御中</Text>
              <View style={S.headerLine} />
            </View>
            <View style={S.serialBlock}>
              <Text style={S.serialCode}>{data.serialCode}</Text>
              <Text>発行日　{data.issueDate}</Text>
            </View>
          </View>

          <Text style={S.intro}>下記の摘要にてサンプルシールを支給いたします。</Text>
          <DataTable rows={rows} salesDept={data.salesDepartment} salesPerson={data.salesPersonName} />

          <View style={S.logoArea}>
            <Image src="/js-company-name.png" style={S.logoImg} />
            <Text style={S.supplierLine}>支給担当：　{data.supplierName}</Text>
          </View>
        </View>

        {/* キリトリ線 */}
        <View style={S.cutArea}>
          <View style={S.cutLine} />
          <Text style={S.cutText}>キ リ ト リ</Text>
          <View style={S.cutLine} />
        </View>

        {/* 下半分：受領書 */}
        <View style={S.half}>
          <View style={S.receiptLogoArea}>
            <Image src="/js-company-name.png" style={S.logoImg} />
            <View style={S.receiptNameLine}>
              <Text style={S.receiptName}>{data.supplierName}</Text>
              <Text style={S.receiptSuffix}>様</Text>
            </View>
          </View>

          <Text style={S.intro}>下記の摘要にてサンプルシールを受領しました。</Text>
          <DataTable rows={rows} salesDept={data.salesDepartment} salesPerson={data.salesPersonName} />

          <View style={S.rightAlign}>
            <Text style={S.destCompany}>{data.companyName}</Text>
            <View style={S.signTable}>
              <View style={S.signRow}>
                <Text style={S.signLabel}>受領日</Text>
                <Text style={S.signValue}></Text>
              </View>
              <View style={S.signRow}>
                <Text style={S.signLabel}>サイン</Text>
                <Text style={S.signValue}></Text>
              </View>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  )
}

export default function PdfDownloadButton({ data, onExported }: { data: PdfData; onExported: () => void }) {
  const [instance, updateInstance] = usePDF({ document: <SlipDocument data={data} /> })

  useEffect(() => {
    updateInstance(<SlipDocument data={data} />)
  }, [data, updateInstance])

  const handleClick = () => {
    if (!instance.url) return
    const link = document.createElement("a")
    link.href = instance.url
    link.download = `送り状_${data.serialCode}.pdf`
    link.click()
    setTimeout(onExported, 500)
  }

  return (
    <button
      onClick={handleClick}
      disabled={instance.loading}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors disabled:opacity-50"
    >
      {instance.loading ? "準備中..." : "📄 PDF出力"}
    </button>
  )
}
