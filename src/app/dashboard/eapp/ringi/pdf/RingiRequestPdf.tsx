import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"
const F = StyleSheet.create({
  page: {
    width: "210mm",
    height: "297mm",
    padding: "8mm 10mm",
    fontFamily: "NotoSansJP",
    fontSize: 8,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "2pt solid #000",
    paddingBottom: "3mm",
    marginBottom: "4mm",
  },
  headerTitle: { fontSize: 16, fontWeight: "bold" },
  headerRight: { alignItems: "flex-end" },
  headerNo: { fontSize: 9 },
  headerDate: { fontSize: 9, marginTop: "1mm" },
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
  fieldLabel: { width: "26mm", fontSize: 7.5, color: "#333", paddingTop: "0.8mm" },
  fieldVal: { flex: 1, border: "0.5pt solid #999", padding: "0.8mm 1.5mm", fontSize: 8, minHeight: "5mm" },
  fieldValTall: { flex: 1, border: "0.5pt solid #999", padding: "1mm 1.5mm", fontSize: 8, minHeight: "30mm" },
  approvalArea: {
    marginTop: "2mm",
    borderTop: "0.5pt solid #999",
    paddingTop: "3mm",
  },
  stageLabel: { fontSize: 8, fontWeight: "bold", marginTop: "2mm", marginBottom: "1mm", color: "#444" },
  approvalRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "0.3pt solid #ddd",
    paddingVertical: "1.2mm",
  },
  approvalPosition: { width: "30mm", fontSize: 7.5, color: "#555" },
  approvalName: { width: "30mm", fontSize: 8 },
  approvalStatus: { width: "20mm", fontSize: 7.5 },
  approvalDate: { flex: 1, fontSize: 7, color: "#777" },
  inkanImage: { width: "8mm", height: "8mm", marginLeft: "2mm" },
})
type ApprovalStepProps = {
  stage: string
  step_order: number
  position_name?: string
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
export default function RingiRequestPdf(props: Props) {
  const stages = Array.from(new Set(props.approval_steps.map(s => s.stage)))
  return (
    <Document>
      <Page size="A4" style={F.page}>
        <View style={F.header}>
          <Text style={F.headerTitle}>稟議書</Text>
          <View style={F.headerRight}>
            <Text style={F.headerNo}>受付番号　{props.reception_number ?? ""}</Text>
            <Text style={F.headerDate}>起案日　{formatDate(props.created_at)}</Text>
          </View>
        </View>
        <View style={F.section}>
          <SectionTitle>基本情報</SectionTitle>
          <View style={F.row}>
            <Field label="件名" value={props.title} />
          </View>
          <View style={F.row}>
            <Field label="起案者" value={props.requester_names} />
            <Field label="起案部" value={props.requester_department} />
          </View>
          <View style={F.row}>
            <Field label="依頼先" value={props.destination} />
            <Field label="費用" value={props.cost} />
          </View>
        </View>
        <View style={F.section}>
          <SectionTitle>目的・内容</SectionTitle>
          <View style={F.row}>
            <Field label="目的・内容" value={props.content} tall />
          </View>
        </View>
        <View style={F.section}>
          <SectionTitle>受付・決裁</SectionTitle>
          <View style={F.row}>
            <Field label="受付番号" value={props.reception_number} />
            <Field label="受付日" value={formatDate(props.reception_date)} />
          </View>
          <View style={F.row}>
            <Field label="決裁結果" value={props.decision_result} />
            <Field label="決裁日" value={formatDate(props.decision_date)} />
          </View>
        </View>
        <View style={F.approvalArea}>
          <SectionTitle>承認状況</SectionTitle>
          {stages.map(stage => (
            <View key={stage}>
              <Text style={F.stageLabel}>{stage}</Text>
              {props.approval_steps.filter(s => s.stage === stage).map(step => (
                <View key={`${step.stage}-${step.step_order}`} style={F.approvalRow}>
                  <Text style={F.approvalPosition}>{step.position_name ?? ""}</Text>
                  <Text style={F.approvalName}>{step.approver_name ?? ""}</Text>
                  <Text style={F.approvalStatus}>{step.status}</Text>
                  <Text style={F.approvalDate}>{step.approved_at ? formatDate(step.approved_at) : ""}</Text>
                  {step.inkan_image_url && (
                    <Image src={step.inkan_image_url} style={F.inkanImage} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
