"use client"
import { useEffect } from "react"
import { usePDF, Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"

Font.register({
  family: "NotoSansJP",
  src: "/NotoSansJP.otf",
})

const S = StyleSheet.create({
  page: { fontFamily: "NotoSansJP", padding: "15mm", fontSize: 9, display: "flex", flexDirection: "column" },
  // 上半分（送り状）
  half: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  companyName: { fontSize: 13, fontWeight: "bold" },
  honorific: { fontSize: 11, fontWeight: "bold" },
  headerLine: { borderBottom: 2, borderColor: "#000", width: 130, marginTop: 3 },
  serialBlock: { alignItems: "flex-end" },
  serialCode: { fontSize: 11, fontWeight: "bold" },
  intro: { marginBottom: 10, fontSize: 9 },
  table: { borderTop: 1, borderLeft: 1, borderColor: "#888", marginBottom: 10 },
  tableRow: { flexDirection: "row", borderBottom: 1, borderColor: "#888" },
  tableLabel: { width: 85, backgroundColor: "#f3f3f3", borderRight: 1, borderColor: "#888", padding: 5, textAlign: "center" },
  tableValue: { flex: 1, padding: 5 },
  tableSplitLeft: { flex: 1, borderRight: 1, borderColor: "#888", padding: 5 },
  tableSplitRight: { flex: 1, padding: 5 },
  logoArea: { alignItems: "flex-end" },
  logoText: { fontSize: 10, fontWeight: "bold" },
  supplierLine: { fontSize: 9, textAlign: "right", marginTop: 2 },
  // キリトリ線（中央）
  cutArea: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  cutLine: { flex: 1, borderBottom: 1, borderStyle: "dashed", borderColor: "#aaa" },
  cutText: { fontSize: 7, color: "#aaa", marginHorizontal: 6 },
  // 下半分（受領書）
  receiptHeaderRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 2 },
  receiptName: { fontSize: 11, fontWeight: "bold" },
  receiptSuffix: { fontSize: 9, marginLeft: 4, marginBottom: 1 },
  receiptNameLine: { borderBottom: 1, borderColor: "#000", marginBottom: 10 },
  rightAlign: { alignItems: "flex-end" },
  destCompany: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  signTable: { borderTop: 1, borderLeft: 1, borderColor: "#888" },
  signRow: { flexDirection: "row", borderBottom: 1, borderColor: "#888" },
  signLabel: { width: 45, backgroundColor: "#f3f3f3", borderRight: 1, borderColor: "#888", padding: 5, fontSize: 8 },
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

function TableRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <>
      {rows.map(({ label, value }) => (
        <View key={label} style={S.tableRow}>
          <Text style={S.tableLabel}>{label}</Text>
          <Text style={S.tableValue}>{value}</Text>
        </View>
      ))}
    </>
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

          <View style={S.table}>
            <TableRows rows={rows} />
            <View style={S.tableRow}>
              <Text style={S.tableLabel}>JS営業担当者</Text>
              <Text style={S.tableSplitLeft}>{data.salesDepartment}</Text>
              <Text style={S.tableSplitRight}>{data.salesPersonName}</Text>
            </View>
          </View>

          <View style={S.logoArea}>
            <Text style={S.logoText}>株式会社 ジャパン・スリーブ</Text>
            <Text style={S.supplierLine}>支給担当：　{data.supplierName}</Text>
          </View>
        </View>

        {/* キリトリ線（中央） */}
        <View style={S.cutArea}>
          <View style={S.cutLine} />
          <Text style={S.cutText}>キ リ ト リ</Text>
          <View style={S.cutLine} />
        </View>

        {/* 下半分：受領書 */}
        <View style={S.half}>
          <View style={{ marginBottom: 10 }}>
            <Text style={S.logoText}>株式会社 ジャパン・スリーブ</Text>
            <View style={S.receiptNameLine}>
              <View style={S.receiptHeaderRow}>
                <Text style={S.receiptName}>{data.supplierName}</Text>
                <Text style={S.receiptSuffix}>様</Text>
              </View>
            </View>
          </View>

          <Text style={S.intro}>下記の摘要にてサンプルシールを受領しました。</Text>

          <View style={S.table}>
            <TableRows rows={rows} />
            <View style={S.tableRow}>
              <Text style={S.tableLabel}>JS営業担当者</Text>
              <Text style={S.tableSplitLeft}>{data.salesDepartment}</Text>
              <Text style={S.tableSplitRight}>{data.salesPersonName}</Text>
            </View>
          </View>

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
