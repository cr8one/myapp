import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer"

const LINE_MM = 7.11
const CONTENT_FONT_SIZE_MM = 9 * 0.3528
const CONTENT_WIDTH_MM = 168

function isHalfWidth(ch: string) {
  const code = ch.codePointAt(0) ?? 0
  return code < 0x3000
}
function wrapLine(text: string, maxWidthMm: number) {
  const lines: string[] = []
  let cur = ""
  let curWidth = 0
  for (const ch of text) {
    const w = (isHalfWidth(ch) ? 0.5 : 1) * CONTENT_FONT_SIZE_MM
    if (curWidth + w > maxWidthMm && cur.length > 0) {
      lines.push(cur)
      cur = ""
      curWidth = 0
    }
    cur += ch
    curWidth += w
  }
  lines.push(cur)
  return lines
}
function wrapParagraphs(text: string) {
  return text
    .split("\n")
    .map(line => wrapLine(line, CONTENT_WIDTH_MM).join("\n"))
    .join("\n")
}

const F = StyleSheet.create({
  page: {
    width: "210mm",
    height: "297mm",
    paddingTop: "12mm",
    paddingBottom: "12mm",
    paddingLeft: "12mm",
    paddingRight: "12mm",
    fontFamily: "NotoSansJP",
    fontSize: 9,
    backgroundColor: "#fff",
  },
  titleZone: { height: "18mm", alignItems: "center", justifyContent: "center" },
  titleText: { fontSize: 22, fontWeight: "bold", letterSpacing: 10 },

  tableA: { flexDirection: "row", border: "0.8pt solid #000", height: "14.35mm" },
  tableACell: { flex: 1, borderRight: "0.8pt solid #000", padding: "1mm 1.5mm" },
  tableACellLast: { flex: 1, padding: "1mm 1.5mm" },
  tableALabel: { fontSize: 7, color: "#000" },
  tableAValue: { fontSize: 8.5, marginTop: "2mm", textAlign: "center" },

  tableB: { flexDirection: "row", border: "0.8pt solid #000", borderTop: "none", height: "25.3mm" },
  tableBCell: { flexDirection: "column", borderRight: "0.8pt solid #000" },
  tableBCellLast: { flexDirection: "column" },
  tableBLabelRow: { height: "6.2mm", alignItems: "center", justifyContent: "center", borderBottom: "0.8pt solid #000" },
  tableBLabelText: { fontSize: 9, fontWeight: "bold" },
  tableBValueRow: { flex: 1, flexDirection: "row-reverse", alignItems: "center", padding: "0 1mm" },
  tableBApproverBlock: { alignItems: "center", marginLeft: "1.5mm" },
  tableBApproverName: { fontSize: 7.5 },
  tableBStamp: { width: "8mm", height: "8mm" },

  sheetGap: { height: "4.1mm" },
  sheet: { border: "0.8pt solid #000", borderTop: "none" },
  sheetTitleRow: { height: "10.5mm", borderBottom: "0.8pt solid #000", flexDirection: "row", alignItems: "flex-end", justifyContent: "flex-end", padding: "0 3mm 1.5mm 3mm" },
  sheetTitleText: { fontSize: 12 },
  sheetTitleSuffix: { fontSize: 10, marginLeft: "2mm" },
  sheetBody: { position: "relative", height: "163.5mm" },
  ruledLine: { position: "absolute", left: 0, right: 0, height: "0.4pt", backgroundColor: "#bbb" },
  sheetText: { position: "absolute", top: 0, left: "3mm", right: "3mm", fontSize: 9, lineHeight: LINE_MM / CONTENT_FONT_SIZE_MM },

  tableCGap: { height: "5.3mm" },
  tableC: { flexDirection: "row", border: "0.8pt solid #000", height: "26.7mm" },
  tableCLabelCol: { width: "5.6mm", borderRight: "0.8pt solid #000", alignItems: "center", justifyContent: "center" },
  tableCLabelText: { fontSize: 8, fontWeight: "bold" },
  tableCStampArea: { flex: 1, flexDirection: "row-reverse" },
  tableCStampCell: { flexDirection: "column", borderRight: "0.8pt solid #000", alignItems: "center" },
  tableCStampCellLast: { flexDirection: "column", alignItems: "center" },
  tableCPositionRow: { height: "7.6mm", borderBottom: "0.8pt solid #000", alignItems: "center", justifyContent: "center", width: "22.3mm" },
  tableCPositionText: { fontSize: 8 },
  tableCApproverRow: { flex: 1, alignItems: "center", justifyContent: "center", width: "22.3mm" },
  tableCApproverName: { fontSize: 7.5 },
  tableCStamp: { width: "8mm", height: "8mm" },
  tableCRequesterLabelCol: { width: "11.2mm", borderLeft: "0.8pt solid #000", alignItems: "center", justifyContent: "center" },
  tableCRequesterValueCol: { flex: 1, alignItems: "center", justifyContent: "center" },
  tableCRequesterValueText: { fontSize: 9 },
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

function VerticalLabel({ text }: { text: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      {text.split("").map((ch, i) => <Text key={i} style={F.tableCLabelText}>{ch}</Text>)}
    </View>
  )
}

function orderByApprovalRightToLeft(steps: ApprovalStepProps[]) {
  const pending = steps.filter(s => s.status !== "承認済み")
  const approved = steps.filter(s => s.status === "承認済み")
    .sort((a, b) => new Date(b.approved_at ?? 0).getTime() - new Date(a.approved_at ?? 0).getTime())
  return [...pending, ...approved]
}

function TableBApprovers({ steps }: { steps: ApprovalStepProps[] }) {
  const ordered = orderByApprovalRightToLeft(steps).filter(s => s.status === "承認済み")
  return (
    <View style={F.tableBValueRow}>
      {ordered.map((s, i) => (
        <View key={i} style={F.tableBApproverBlock}>
          {s.inkan_image_url
            ? <Image src={s.inkan_image_url} style={F.tableBStamp} />
            : <Text style={F.tableBApproverName}>{s.approver_name ?? ""}</Text>}
        </View>
      ))}
    </View>
  )
}

export default function RingiRequestPdf(props: Props) {
  const draftSteps = props.approval_steps
    .filter(s => s.stage === "起案部")
    .sort((a, b) => b.step_order - a.step_order)

  const relatedAll = props.approval_steps.filter(s => s.stage === "関連部役員社長")
  const shachoSteps = relatedAll.filter(s => s.category === "社長")
  const yakuinSteps = relatedAll.filter(s => s.category === "役員")
  const kanrenSteps = relatedAll.filter(s => s.category === "関連部" || !s.category)

  const ruledLines = []
  for (let i = 1; i <= 22; i++) {
    ruledLines.push(<View key={i} style={[F.ruledLine, { top: `${(i * LINE_MM).toFixed(2)}mm` }]} />)
  }

  const bodyText = wrapParagraphs(
    `${formatDate(props.created_at)}\n${props.requester_department ?? ""}　${props.requester_names ?? ""}\n\n記\n\n１．目的・内容\n${props.content ?? ""}\n\n２．依頼先\n${props.destination ?? ""}\n\n３．費用\n${props.cost ?? ""}`
  )

  return (
    <Document>
      <Page size="A4" style={F.page}>
        <View style={F.titleZone}>
          <Text style={F.titleText}>稟　議　書</Text>
        </View>

        <View style={F.tableA}>
          <View style={F.tableACell}>
            <Text style={F.tableALabel}>決裁年月日</Text>
            <Text style={F.tableAValue}>{formatDate(props.decision_date)}</Text>
          </View>
          <View style={F.tableACell}>
            <Text style={F.tableALabel}>決裁結果</Text>
            <Text style={F.tableAValue}>{props.decision_result ?? ""}</Text>
          </View>
          <View style={F.tableACell}>
            <Text style={F.tableALabel}>受付番号</Text>
            <Text style={F.tableAValue}>{props.reception_number ?? ""}</Text>
          </View>
          <View style={F.tableACell}>
            <Text style={F.tableALabel}>受付日</Text>
            <Text style={F.tableAValue}>{formatDate(props.reception_date)}</Text>
          </View>
          <View style={F.tableACellLast}>
            <Text style={F.tableALabel}>起案日</Text>
            <Text style={F.tableAValue}>{formatDate(props.created_at)}</Text>
          </View>
        </View>

        <View style={F.tableB}>
          <View style={[F.tableBCell, { width: "22.3mm" }]}>
            <View style={F.tableBLabelRow}><Text style={F.tableBLabelText}>社　長</Text></View>
            <TableBApprovers steps={shachoSteps} />
          </View>
          <View style={[F.tableBCell, { width: "67.1mm" }]}>
            <View style={F.tableBLabelRow}><Text style={F.tableBLabelText}>役　員</Text></View>
            <TableBApprovers steps={yakuinSteps} />
          </View>
          <View style={[F.tableBCell, { width: "44.7mm" }]}>
            <View style={F.tableBLabelRow}><Text style={F.tableBLabelText}>関　連　部</Text></View>
            <TableBApprovers steps={kanrenSteps} />
          </View>
          <View style={[F.tableBCellLast, { flex: 1 }]}>
            <View style={F.tableBLabelRow}><Text style={F.tableBLabelText}>受付　総務経理課</Text></View>
            <View style={{ flex: 1 }} />
          </View>
        </View>

        <View style={F.sheetGap} />

        <View style={F.sheet}>
          <View style={F.sheetTitleRow}>
            <Text style={F.sheetTitleText}>{props.title ?? ""}</Text>
            <Text style={F.sheetTitleSuffix}>の　件</Text>
          </View>
          <View style={F.sheetBody}>
            {ruledLines}
            <Text style={F.sheetText} hyphenationCallback={(w: string) => [w]}>{bodyText}</Text>
          </View>
        </View>

        <View style={F.tableCGap} />

        <View style={F.tableC}>
          <View style={F.tableCLabelCol}><VerticalLabel text="起案部" /></View>
          <View style={F.tableCStampArea}>
            {draftSteps.map((s, i) => (
              <View key={i} style={i === draftSteps.length - 1 ? F.tableCStampCellLast : F.tableCStampCell}>
                <View style={F.tableCPositionRow}><Text style={F.tableCPositionText}>{s.position_name ?? ""}</Text></View>
                <View style={F.tableCApproverRow}>
                  {s.status === "承認済み" ? (
                    s.inkan_image_url
                      ? <Image src={s.inkan_image_url} style={F.tableCStamp} />
                      : <Text style={F.tableCApproverName}>{s.approver_name ?? ""}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
          <View style={F.tableCRequesterLabelCol}><VerticalLabel text="起案者" /></View>
          <View style={F.tableCRequesterValueCol}>
            <Text style={F.tableCRequesterValueText}>{props.requester_names ?? ""}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}