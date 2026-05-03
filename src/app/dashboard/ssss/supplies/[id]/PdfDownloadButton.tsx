"use client"
import { useEffect } from "react"
import { usePDF, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  companyName: { fontSize: 14, fontWeight: "bold" },
  honorific: { fontSize: 12, fontWeight: "bold" },
  headerLine: { borderBottom: 2, borderColor: "#000", width: 120, marginTop: 4 },
  serialBlock: { alignItems: "flex-end" },
  serialCode: { fontSize: 11, fontWeight: "bold" },
  intro: { marginBottom: 12, fontSize: 9 },
  table: { borderTop: 1, borderLeft: 1, borderColor: "#999", marginBottom: 12 },
  tableRow: { flexDirection: "row", borderBottom: 1, borderColor: "#999" },
  tableLabel: { width: 90, backgroundColor: "#f5f5f5", borderRight: 1, borderColor: "#999", padding: 5, textAlign: "center" },
  tableValue: { flex: 1, padding: 5 },
  tableSplitLeft: { flex: 1, borderRight: 1, borderColor: "#999", padding: 5 },
  tableSplitRight: { flex: 1, padding: 5 },
  logoArea: { alignItems: "flex-end", marginBottom: 4 },
  companyLogo: { fontSize: 10 },
  supplierLine: { fontSize: 9, textAlign: "right" },
  cutText: { fontSize: 8, color: "#aaa", textAlign: "center", marginBottom: 4 },
  cutLine: { borderBottom: 1, borderStyle: "dashed", borderColor: "#aaa", marginBottom: 16 },
  receiptHeader: { marginBottom: 12 },
  receiptNameRow: { flexDirection: "row", alignItems: "flex-end" },
  receiptName: { fontSize: 11, fontWeight: "bold", borderBottom: 1, borderColor: "#000" },
  receiptSuffix: { fontSize: 9, marginLeft: 4, marginBottom: 2 },
  rightAlign: { alignItems: "flex-end" },
  destCompany: { fontSize: 11, fontWeight: "bold", marginBottom: 8 },
  signTable: { borderTop: 1, borderLeft: 1, borderColor: "#999" },
  signRow: { flexDirection: "row", borderBottom: 1, borderColor: "#999" },
  signLabel: { width: 50, backgroundColor: "#f5f5f5", borderRight: 1, borderColor: "#999", padding: 5 },
  signValue: { width: 100, padding: 5 },
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

function SlipDocument({ data }: { data: PdfData }) {
  const rows = [
    { label: "品　番", value: data.productCode },
    { label: "受注ＮＯ", value: data.orderNo },
    { label: "貼り付けパーツ", value: data.partName },
    { label: "支給枚数", value: `${data.qty}　枚` },
  ]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 送り状 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{data.companyName}</Text>
            <Text style={styles.honorific}>御中</Text>
            <View style={styles.headerLine} />
          </View>
          <View style={styles.serialBlock}>
            <Text style={styles.serialCode}>{data.serialCode}</Text>
            <Text>発行日　{data.issueDate}</Text>
          </View>
        </View>

        <Text style={styles.intro}>下記の摘要にてサンプルシールを支給いたします。</Text>

        <View style={styles.table}>
          {rows.map(({ label, value }) => (
            <View key={label} style={styles.tableRow}>
              <Text style={styles.tableLabel}>{label}</Text>
              <Text style={styles.tableValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>JS営業担当者</Text>
            <Text style={styles.tableSplitLeft}>{data.salesDepartment}</Text>
            <Text style={styles.tableSplitRight}>{data.salesPersonName}</Text>
          </View>
        </View>

        <View style={styles.logoArea}>
          <Text style={styles.companyLogo}>株式会社 ジャパン・スリーブ</Text>
          <Text style={styles.supplierLine}>支給担当：　{data.supplierName}</Text>
        </View>

        {/* キリトリ */}
        <Text style={styles.cutText}>キ リ ト リ</Text>
        <View style={styles.cutLine} />

        {/* 受領書 */}
        <View style={styles.receiptHeader}>
          <Text style={styles.companyLogo}>株式会社 ジャパン・スリーブ</Text>
          <View style={styles.receiptNameRow}>
            <Text style={styles.receiptName}>{data.supplierName}</Text>
            <Text style={styles.receiptSuffix}>様</Text>
          </View>
        </View>

        <Text style={styles.intro}>下記の摘要にてサンプルシールを受領しました。</Text>

        <View style={styles.table}>
          {rows.map(({ label, value }) => (
            <View key={label} style={styles.tableRow}>
              <Text style={styles.tableLabel}>{label}</Text>
              <Text style={styles.tableValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>JS営業担当者</Text>
            <Text style={styles.tableSplitLeft}>{data.salesDepartment}</Text>
            <Text style={styles.tableSplitRight}>{data.salesPersonName}</Text>
          </View>
        </View>

        <View style={styles.rightAlign}>
          <Text style={styles.destCompany}>{data.companyName}</Text>
          <View style={styles.signTable}>
            <View style={styles.signRow}>
              <Text style={styles.signLabel}>受領日</Text>
              <Text style={styles.signValue}></Text>
            </View>
            <View style={styles.signRow}>
              <Text style={styles.signLabel}>サイン</Text>
              <Text style={styles.signValue}></Text>
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
