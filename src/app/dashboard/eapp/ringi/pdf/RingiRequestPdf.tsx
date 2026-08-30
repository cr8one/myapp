import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
const F = StyleSheet.create({
  page: {
    width: "210mm",
    height: "297mm",
    padding: "10mm 12mm",
    fontFamily: "NotoSansJP",
    fontSize: 8,
    backgroundColor: "#fff",
  },
  topRow: {
    flexDirection: "row",
    border: "0.7pt solid #000",
    marginBottom: "3mm",
  },
  topLeftBlock: { flex: 1, flexDirection: "row" },
  topCell: {
    flex: 1,
    borderRight: "0.7pt solid #000",
    padding: "1mm 1.5mm",
  },
  topCellLast: { flex: 1, padding: "1mm 1.5mm" },
  topCellLabel: { fontSize: 6.5, color: "#333", marginBottom: "1mm" },
  topCellValue: { fontSize: 8, minHeight: "4mm" },
  noBox: {
    width: "18mm",
    borderLeft: "0.7pt solid #000",
    alignItems: "center",
    justifyContent: "center",
    padding: "1mm",
  },
  noLabel: { fontSize: 7, marginBottom: "1mm" },
  noValue: { fontSize: 9 },
  titleRow: {
    alignItems: "center",
    marginVertical: "4mm",
  },
  titleText: { fontSize: 20, fontWeight: "bold", letterSpacing: 8 },
  approvalTableWrap: {
    border: "0.7pt solid #000",
    marginBottom: "3mm",
  },
  approvalTableRow: { flexDirection: "row" },
  approvalTableLabelCol: {
    width: "14mm",
    borderRight: "0.7pt solid #000",
    borderTop: "0.7pt solid #000",
    alignItems: "center",
    justifyContent: "center",
    padding: "1mm",
  },
  approvalTableLabelColFirst: {
    width: "14mm",
    borderRight: "0.7pt solid #000",
    alignItems: "center",
    justifyContent: "center",
    padding: "1mm",
  },
  approvalTableLabelText: { fontSize: 7.5, fontWeight: "bold" },
  approvalCellsRow: { flex: 1, flexDirection: "row", flexWrap: "wrap" },
  approvalCell: {
    width: "25mm",
    borderRight: "0.7pt solid #000",
    borderTop: "0.7pt solid #000",
    padding: "1mm",
    minHeight: "16mm",
    alignItems: "center",
  },
  approvalCellFirstRow: {
    width: "25mm",
    borderRight: "0.7pt solid #000",
    padding: "1mm",
    minHeight: "16mm",
    alignItems: "center",
  },
  approvalCellPosition: { fontSize: 6.5, color: "#333" },
  approvalCellName: { fontSize: 8, marginTop: "1mm" },
  approvalCellStamp: { width: "9mm", height: "9mm", marginTop: "1mm" },
  approvalCellEmpty: { fontSize: 6.5, color: "#bbb" },
  section: { marginBottom: "3mm" },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    backgroundColor: "#eee",
    padding: "1mm 2mm",
    marginBottom: "1.5mm",
  },
  row: { flexDirection: "row", marginBottom: "1mm" },
  field: { flexDirection: "row", flex: 1, marginRight: "2mm" },
  fieldLabel: { width: "22mm", fontSize: 7.5, color: "#333", paddingTop: "0.8mm" },
  fieldVal: { flex: 1, border: "0.5pt solid #999", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5mm" },
  fieldValTall: { flex: 1, border: "0.5pt solid #999", padding: "1mm 1.5mm", fontSize: 8, minHeight: "28mm" },
  titleFieldRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: "3mm" },
  titleFieldVal: { flex: 1, borderBottom: "0.7pt solid #000", fontSize: 11, padding: "1mm 2mm" },
  titleFieldSuffix: { fontSize: 10, marginLeft: "2mm" },
  dateRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: "3mm" },
  dateText: { fontSize: 8.5 },
  requesterRow: { alignItems: "flex-end", marginBottom: "3mm" },
  requesterText: { fontSize: 9 },
  kiRow: { alignItems: "center", marginBottom: "3mm" },
  kiText: { fontSize: 11, fontWeight: "bold" },
  numberedLabel: { fontSize: 9, fontWeight: "bold", marginBottom: "1mm" },
})
type ApprovalStepProps = {
  stage: string
  step_order: number
  position_name?: string
  category?: string
  approver_name?: string
  status: string
  approved_at?: string
  inkan_image_url?: string
}
type Props = {
  title: string
  content?: string
  destination?: string
  cost?: string
  requester_names?: string
  requester_department?: string
  reception_number?: string
  reception_date?: string
  decision_date?: string
  decision_result?: string
  created_at?: string
  approval_steps: ApprovalStepProps[]
}
function formatDate(str?: string) {
  if (!str) return ""
  const d = new Date(str)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
function ApprovalCell({ step, isFirstRow, alwaysShowPosition }: { step?: ApprovalStepProps; isFirstRow: boolean; alwaysShowPosition?: boolean }) {
  const style = isFirstRow ? F.approvalCellFirstRow : F.approvalCell
  if (!step) {
    return (
      <View style={style}>
        <Text style={F.approvalCellEmpty}></Text>
      </View>
    )
  }
  const isApproved = step.status === "承認済み"
  return (
    <View style={style}>
      {(alwaysShowPosition || isApproved) && <Text style={F.approvalCellPosition}>{step.position_name ?? ""}</Text>}
      {isApproved && <Text style={F.approvalCellName}>{step.approver_name ?? ""}</Text>}
      {isApproved && step.inkan_image_url && <Image src={step.inkan_image_url} style={F.approvalCellStamp} />}
    </View>
  )
}
function orderByApprovalRightToLeft(steps: ApprovalStepProps[]) {
  const pending = steps.filter(s => s.status !== "承認済み")
  const approved = steps.filter(s => s.status === "承認済み")
    .sort((a, b) => new Date(b.approved_at ?? 0).getTime() - new Date(a.approved_at ?? 0).getTime())
  return [...pending, ...approved]
}
export default function RingiRequestPdf(props: Props) {
  const draftSteps = props.approval_steps
    .filter(s => s.stage === "起案部")
    .sort((a, b) => b.step_order - a.step_order)

  const relatedAll = props.approval_steps.filter(s => s.stage === "関連部役員社長")
  const shachoSteps = orderByApprovalRightToLeft(relatedAll.filter(s => s.category === "社長"))
  const yakuinSteps = orderByApprovalRightToLeft(relatedAll.filter(s => s.category === "役員"))
  const kanrenSteps = orderByApprovalRightToLeft(relatedAll.filter(s => s.category === "関連部" || !s.category))

  return (
    <Document>
      <Page size="A4" style={F.page}>
        <View style={F.topRow}>
          <View style={F.topLeftBlock}>
            <View style={F.topCell}>
              <Text style={F.topCellLabel}>決裁結果</Text>
              <Text style={F.topCellValue}>{props.decision_result ?? ""}</Text>
            </View>
            <View style={F.topCell}>
              <Text style={F.topCellLabel}>受付番号</Text>
              <Text style={F.topCellValue}>{props.reception_number ?? ""}</Text>
            </View>
            <View style={F.topCell}>
              <Text style={F.topCellLabel}>受付日</Text>
              <Text style={F.topCellValue}>{formatDate(props.reception_date)}</Text>
            </View>
            <View style={F.topCellLast}>
              <Text style={F.topCellLabel}>起案日</Text>
              <Text style={F.topCellValue}>{formatDate(props.created_at)}</Text>
            </View>
          </View>
          <View style={F.noBox}>
            <Text style={F.noLabel}>Ｎｏ</Text>
          </View>
        </View>

        <View style={F.titleRow}>
          <Text style={F.titleText}>稟　議　書</Text>
        </View>

        <View style={F.approvalTableWrap}>
          <View style={F.approvalTableRow}>
            <View style={F.approvalTableLabelColFirst}>
              <Text style={F.approvalTableLabelText}>起案部</Text>
            </View>
            <View style={F.approvalCellsRow}>
              {draftSteps.length > 0 ? (
                draftSteps.map((s, i) => <ApprovalCell key={i} step={s} isFirstRow={true} alwaysShowPosition />)
              ) : (
                <ApprovalCell isFirstRow={true} />
              )}
            </View>
          </View>
          <View style={F.approvalTableRow}>
            <View style={F.approvalTableLabelCol}>
              <Text style={F.approvalTableLabelText}>関連部</Text>
            </View>
            <View style={F.approvalCellsRow}>
              {kanrenSteps.length > 0 ? (
                kanrenSteps.map((s, i) => <ApprovalCell key={i} step={s} isFirstRow={false} />)
              ) : (
                <ApprovalCell isFirstRow={false} />
              )}
            </View>
          </View>
          <View style={F.approvalTableRow}>
            <View style={F.approvalTableLabelCol}>
              <Text style={F.approvalTableLabelText}>役員</Text>
            </View>
            <View style={F.approvalCellsRow}>
              {yakuinSteps.length > 0 ? (
                yakuinSteps.map((s, i) => <ApprovalCell key={i} step={s} isFirstRow={false} />)
              ) : (
                <ApprovalCell isFirstRow={false} />
              )}
            </View>
          </View>
          <View style={F.approvalTableRow}>
            <View style={F.approvalTableLabelCol}>
              <Text style={F.approvalTableLabelText}>社長</Text>
            </View>
            <View style={F.approvalCellsRow}>
              <ApprovalCell step={shachoSteps[0]} isFirstRow={false} />
            </View>
          </View>
        </View>

        <View style={F.titleFieldRow}>
          <Text style={F.titleFieldVal}>{props.title}</Text>
          <Text style={F.titleFieldSuffix}>の　件</Text>
        </View>

        <View style={F.dateRow}>
          <Text style={F.dateText}>{formatDate(props.created_at)}</Text>
        </View>

        <View style={F.requesterRow}>
          <Text style={F.requesterText}>{props.requester_department ?? ""}</Text>
          <Text style={F.requesterText}>{props.requester_names ?? ""}</Text>
        </View>

        <View style={F.kiRow}>
          <Text style={F.kiText}>記</Text>
        </View>

        <View style={F.section}>
          <Text style={F.numberedLabel}>１．目的・内容</Text>
          <Text style={F.fieldValTall}>{props.content ?? ""}</Text>
        </View>

        <View style={F.section}>
          <Text style={F.numberedLabel}>２．依頼先</Text>
          <Text style={F.fieldVal}>{props.destination ?? ""}</Text>
        </View>

        <View style={F.section}>
          <Text style={F.numberedLabel}>３．費用</Text>
          <Text style={F.fieldVal}>{props.cost ?? ""}</Text>
        </View>
      </Page>
    </Document>
  )
}
function Field({ label, value, tall }: { label: string; value?: string; tall?: boolean }) {
  return (
    <View style={F.field}>
      <Text style={F.fieldLabel}>{label}</Text>
      <Text style={tall ? F.fieldValTall : F.fieldVal}>{value ?? ""}</Text>
    </View>
  )
}
function SectionTitle({ children }: { children: string }) {
  return <Text style={F.sectionTitle}>{children}</Text>
}
