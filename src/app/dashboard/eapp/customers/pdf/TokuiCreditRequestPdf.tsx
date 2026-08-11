import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

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
  fieldValTall: { flex: 1, border: "0.5pt solid #999", padding: "1mm 1.5mm", fontSize: 8, minHeight: "10mm" },
  commentBlock: { marginBottom: "2mm" },
  commentLabel: { fontSize: 7.5, color: "#333", marginBottom: "0.5mm" },
  commentBox: { border: "0.5pt solid #999", padding: "1.5mm 2mm", fontSize: 8, minHeight: "12mm" },
  approvalArea: {
    marginTop: "2mm",
    borderTop: "0.5pt solid #999",
    paddingTop: "3mm",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  approvalStep: {
    width: "24mm",
    alignItems: "center",
    marginRight: "3mm",
    marginBottom: "3mm",
  },
  approvalPosition: { fontSize: 6.5, color: "#555", marginBottom: "1mm" },
  approvalName: { fontSize: 7, marginBottom: "1mm" },
  stampCircle: {
    width: "9mm",
    height: "9mm",
    borderRadius: "4.5mm",
    border: "0.6pt solid #c0392b",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-6deg)",
  },
  stampText: {
    fontFamily: "YujiSyuku",
    fontSize: 11,
    color: "#c0392b",
  },
  stampEmpty: {
    width: "9mm",
    height: "9mm",
    borderRadius: "4.5mm",
    border: "0.5pt dashed #ccc",
  },
})

type ApprovalStepProps = {
  step_order: number
  position_name?: string
  approver_name?: string
  approver_last_name?: string
  status: string
  approved_at?: string
}

type Props = {
  uid: string
  requested_date?: string
  company_name?: string
  industry?: string
  representative_name?: string
  capital?: string
  established_year_month?: string
  annual_revenue?: string
  employee_count?: string
  main_bank_name?: string
  main_bank_branch?: string
  postal_code?: string
  address?: string
  tel?: string
  fax?: string
  payment_terms?: string
  order_contact_dept?: string
  order_contact_name?: string
  sales_rep_name?: string
  order_items?: string
  order_amount?: string
  future_prospects?: string
  requested_credit_limit?: string
  manager_comment?: string
  division_head_comment?: string
  accounting_comment?: string
  approved_credit_limit?: string
  approved_date?: string
  remarks?: string
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

function ApprovalStamp({ step }: { step: ApprovalStepProps }) {
  const approved = step.status === "承認済み" || step.status === "登録済み"
  return (
    <View style={F.approvalStep}>
      <Text style={F.approvalPosition}>{step.position_name ?? ""}</Text>
      <Text style={F.approvalName}>{step.approver_name ?? ""}</Text>
      {approved && step.approver_last_name ? (
        <View style={F.stampCircle}>
          <Text style={F.stampText}>{step.approver_last_name}</Text>
        </View>
      ) : (
        <View style={F.stampEmpty} />
      )}
    </View>
  )
}

export default function TokuiCreditRequestPdf(props: Props) {
  return (
    <Document>
      <Page size="A4" style={F.page}>
        <View style={F.header}>
          <Text style={F.headerTitle}>取引限度設定書</Text>
          <View style={F.headerRight}>
            <Text style={F.headerNo}>No. {props.uid}</Text>
            <Text style={F.headerDate}>申請日　{formatDate(props.requested_date)}</Text>
          </View>
        </View>

        <View style={F.section}>
          <SectionTitle>会社概要</SectionTitle>
          <View style={F.row}>
            <Field label="会社名" value={props.company_name} />
            <Field label="業種" value={props.industry} />
          </View>
          <View style={F.row}>
            <Field label="代表者" value={props.representative_name} />
            <Field label="資本金" value={props.capital} />
          </View>
          <View style={F.row}>
            <Field label="設立年月" value={props.established_year_month} />
            <Field label="年商" value={props.annual_revenue} />
          </View>
          <View style={F.row}>
            <Field label="従業員数" value={props.employee_count} />
            <Field label="メインバンク" value={props.main_bank_name} />
          </View>
          <View style={F.row}>
            <Field label="支店" value={props.main_bank_branch} />
            <Field label="郵便番号" value={props.postal_code} />
          </View>
          <View style={F.row}>
            <Field label="住所" value={props.address} />
          </View>
          <View style={F.row}>
            <Field label="TEL" value={props.tel} />
            <Field label="FAX" value={props.fax} />
          </View>
        </View>

        <View style={F.section}>
          <SectionTitle>取引条件</SectionTitle>
          <View style={F.row}>
            <Field label="支払条件" value={props.payment_terms} />
            <Field label="担当営業" value={props.sales_rep_name} />
          </View>
          <View style={F.row}>
            <Field label="受注窓口部署" value={props.order_contact_dept} />
            <Field label="受注窓口氏名" value={props.order_contact_name} />
          </View>
          <View style={F.row}>
            <Field label="取扱商品" value={props.order_items} tall />
          </View>
          <View style={F.row}>
            <Field label="想定受注額" value={props.order_amount} />
          </View>
          <View style={F.row}>
            <Field label="将来展望" value={props.future_prospects} tall />
          </View>
        </View>

        <View style={F.section}>
          <SectionTitle>申請内容</SectionTitle>
          <View style={F.row}>
            <Field label="希望与信限度額" value={props.requested_credit_limit} />
          </View>
          <View style={F.row}>
            <Field label="備考" value={props.remarks} tall />
          </View>
        </View>

        <View style={F.section}>
          <SectionTitle>所感</SectionTitle>
          <View style={F.commentBlock}>
            <Text style={F.commentLabel}>マネージャー所感</Text>
            <Text style={F.commentBox}>{props.manager_comment ?? ""}</Text>
          </View>
          <View style={F.commentBlock}>
            <Text style={F.commentLabel}>事業部長及び部長所感</Text>
            <Text style={F.commentBox}>{props.division_head_comment ?? ""}</Text>
          </View>
          <View style={F.commentBlock}>
            <Text style={F.commentLabel}>経理部所感</Text>
            <Text style={F.commentBox}>{props.accounting_comment ?? ""}</Text>
          </View>
        </View>

        <View style={F.section}>
          <SectionTitle>決裁</SectionTitle>
          <View style={F.row}>
            <Field label="承認与信限度額" value={props.approved_credit_limit} />
            <Field label="承認日" value={formatDate(props.approved_date)} />
          </View>
        </View>

        <View style={F.approvalArea}>
          {props.approval_steps.map(step => (
            <ApprovalStamp key={step.step_order} step={step} />
          ))}
        </View>
      </Page>
    </Document>
  )
}