import { Document, Page, View, Text, Image, Svg, Line, Rect, G } from "@react-pdf/renderer"
import {
  PAGE_W_MM, PAGE_H_MM, LINES, FILLS, LINE_WIDTH_MM, CYAN, FONT, Box,
  TITLE, DATE_LINE, SLIP_NO,
  ACCOUNT_LABEL, TAX_LABEL, ACCOUNT_VALUE, TAX_VALUE, DEPT_LABEL, DEPT_VALUE, NAME_LABEL, NAME_VALUE,
  HEAD_TRIP, HEAD_TRANSPORT, HEAD_LODGING, SUB_DATE, SUB_TIME, SUB_SECTION, SUB_AMOUNT,
  SUB_LODGING_NAME, SUB_NIGHTS, SUB_LODGING_AMOUNT,
  TRIP_ROWS, HEAD_AREA, AREA_TEXT, TRANSPORT_ROWS, TRANSPORT_SUBTOTAL_LABEL, TRANSPORT_SUBTOTAL,
  LODGING_ROWS, LODGING_SUBTOTAL_LABEL, LODGING_SUBTOTAL,
  HEAD_ALLOWANCE, SUB_DAYS, SUB_ALLOWANCE_AMOUNT, ALLOWANCE_ROWS, ALLOWANCE_SUBTOTAL_LABEL, ALLOWANCE_SUBTOTAL,
  TOTAL_LABEL, TOTAL_VALUE,
  APPROVAL_Y0, APPROVAL_H, APPROVAL_SLOT_W, APPROVAL_GROUP_REQUESTER, APPROVAL_GROUP_ACCOUNTING, APPROVAL_HEADER_H,
  fitText, fitParagraph, yen, fmtMD, fmtYMD, fmtTime,
} from "@/lib/accounting-trip-layout"

const P = (mm: number) => (mm * 72) / 25.4 // mm → pt
const PT_MM = 25.4 / 72
// このフォント（Noto Sans CJK JP）は、行の高さを文字と同じにしても、漢字の絵の中心が、行の上端から約0.8em下に描かれる（実測、補正値は0.81）。
// 枠の中心に合わせるため、行の上端を、その分だけ上にずらして置く。枠の高さには頼らない（低い枠でも文字が消えない）
const INK_CENTER = 0.81

export type TripPdfApproval = {
  stage: string
  positionName: string | null
  approverName: string | null
  approved: boolean
  dateText: string | null // 承認日（例：10/21）
  stampUrl: string | null // 承認印の画像のURL
}

export type TripPdfData = {
  slipNo: number
  slipDate: string // YYYY-MM-DD
  requesterName: string
  departmentName: string | null
  accountName: string
  accountCode: string
  taxCategory: string
  areaPurpose: string | null
  tripDates: { label: string; date: string; time: string }[]
  transport: { section: string; amount: number }[]
  lodging: { name: string; nights: number; amount: number }[]
  allowance: { days: number; amount: number }[]
  transportSubtotal: number
  lodgingSubtotal: number
  allowanceSubtotal: number
  total: number
  approvals: TripPdfApproval[] // 承認の順（最初の承認者が先頭）
}

type Align = "left" | "center" | "right"

// 箱の中に、1行の文字を置く（収まらなければ、文字サイズを下げる）
function Cell({ b, text, max = FONT.body, min = 6, align = "center", pad = 1.2 }: {
  b: Box; text: string; max?: number; min?: number; align?: Align; pad?: number
}) {
  if (!text) return null
  const fit = fitText(text, b.w - pad * 2, max, min)
  const top = b.y + b.h / 2 - INK_CENTER * fit.size * PT_MM
  return (
    <View style={{ position: "absolute", left: P(b.x + pad), top: P(top), width: P(b.w - pad * 2) }}>
      <Text style={{ fontSize: fit.size, textAlign: align, lineHeight: 1 }}>{fit.text}</Text>
    </View>
  )
}

// 承認欄の枠の位置。最初の承認者がグループの右端に来て、右から左へ詰める
function approvalSlots(list: TripPdfApproval[], group: { left: number; right: number }) {
  const n = list.length
  if (n === 0) return []
  const w = Math.min(APPROVAL_SLOT_W, (group.right - group.left) / n)
  return list.map((item, i) => ({ item, x: group.right - (i + 1) * w, w }))
}

export default function TripExpensePdf({ data }: { data: TripPdfData }) {
  const d = data
  const trip = [0, 1].map(i => d.tripDates[i])
  const area = fitParagraph(d.areaPurpose ?? "", AREA_TEXT.w - 2.4, AREA_TEXT.h - 2, 11, 6.5)
  const slots = [
    ...approvalSlots(d.approvals.filter(a => a.stage === "起案部"), APPROVAL_GROUP_REQUESTER),
    ...approvalSlots(d.approvals.filter(a => a.stage !== "起案部"), APPROVAL_GROUP_ACCOUNTING),
  ]

  return (
    <Document>
      <Page size={[P(PAGE_W_MM), P(PAGE_H_MM)]} style={{ fontFamily: "NotoSansJP", color: "#000" }}>
        {/* 罫線と水色の塗り */}
        <Svg viewBox={`0 0 ${PAGE_W_MM} ${PAGE_H_MM}`} width={P(PAGE_W_MM)} height={P(PAGE_H_MM)} style={{ position: "absolute", left: 0, top: 0 }}>
          {FILLS.map((f, i) => <Rect key={`f${i}`} x={f.x} y={f.y} width={f.w} height={f.h} fill={CYAN} />)}
          {LINES.map((l, i) => <Line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#000" strokeWidth={LINE_WIDTH_MM} strokeLinecap="square" />)}
          {slots.map((s, i) => (
            <G key={`a${i}`}>
              <Rect x={s.x} y={APPROVAL_Y0} width={s.w} height={APPROVAL_H} fill="none" stroke="#000" strokeWidth={LINE_WIDTH_MM} />
              <Line x1={s.x} y1={APPROVAL_Y0 + APPROVAL_HEADER_H} x2={s.x + s.w} y2={APPROVAL_Y0 + APPROVAL_HEADER_H} stroke="#000" strokeWidth={LINE_WIDTH_MM} />
            </G>
          ))}
        </Svg>

        {/* タイトルと日付 */}
        <Cell b={TITLE} text="出金伝票　(出張旅費精算書（国内）)" max={FONT.title} min={FONT.title} align="left" pad={0} />
        <Cell b={DATE_LINE} text={fmtYMD(d.slipDate)} max={FONT.label} align="right" pad={0} />
        <Cell b={SLIP_NO} text={`伝票番号 ${d.slipNo}`} max={FONT.small} align="right" pad={0} />

        {/* 上の枠 */}
        <Cell b={ACCOUNT_LABEL} text="勘定科目" />
        <Cell b={TAX_LABEL} text="課税区分" />
        <Cell b={ACCOUNT_VALUE} text={`${d.accountName}　${d.accountCode}`} />
        <Cell b={TAX_VALUE} text={d.taxCategory} />
        <Cell b={DEPT_LABEL} text="部署" />
        <Cell b={DEPT_VALUE} text={d.departmentName ?? ""} align="left" pad={2} />
        <Cell b={NAME_LABEL} text="氏名" />
        <Cell b={NAME_VALUE} text={d.requesterName} align="left" pad={2} />

        {/* 見出し */}
        <Cell b={HEAD_TRIP} text="出張期間" />
        <Cell b={HEAD_TRANSPORT} text="交通費" />
        <Cell b={HEAD_LODGING} text="宿泊費" />
        <Cell b={SUB_DATE} text="日付" />
        <Cell b={SUB_TIME} text="時　間" />
        <Cell b={SUB_SECTION} text="区　間" />
        <Cell b={SUB_AMOUNT} text="金額" />
        <Cell b={SUB_LODGING_NAME} text="宿泊先" />
        <Cell b={SUB_NIGHTS} text="泊数" />
        <Cell b={SUB_LODGING_AMOUNT} text="金額" />
        <Cell b={HEAD_AREA} text="出張区域・用" />
        <Cell b={HEAD_ALLOWANCE} text="日　当" />
        <Cell b={SUB_DAYS} text="日数" />
        <Cell b={SUB_ALLOWANCE_AMOUNT} text="金額" />

        {/* 出張期間 */}
        {TRIP_ROWS.map((r, i) => (
          <View key={`t${i}`}>
            <Cell b={r.date} text={trip[i]?.date ? fmtMD(trip[i].date) : ""} max={FONT.body} />
            <Cell b={r.label} text={trip[i]?.label ?? ""} max={FONT.small} />
            <Cell b={r.time} text={trip[i]?.time ? fmtTime(trip[i].time) : ""} max={FONT.body} />
          </View>
        ))}

        {/* 出張区域・用（1つの大きな枠。行ごとに、1行ずつ置く） */}
        {area.lines.map((line, i) => {
          const pitch = area.size * PT_MM * 1.35
          const center = AREA_TEXT.y + 1 + (i + 0.5) * pitch
          return (
            <View key={`ar${i}`} style={{ position: "absolute", left: P(AREA_TEXT.x + 1.2), width: P(AREA_TEXT.w - 2.4), top: P(center - INK_CENTER * area.size * PT_MM) }}>
              <Text style={{ fontSize: area.size, lineHeight: 1 }}>{line}</Text>
            </View>
          )
        })}

        {/* 交通費 */}
        {TRANSPORT_ROWS.map((r, i) => (
          <View key={`tr${i}`}>
            <Cell b={r.section} text={d.transport[i]?.section ?? ""} align="left" pad={2} />
            <Cell b={r.amount} text={d.transport[i] ? yen(d.transport[i].amount) : ""} align="right" pad={2} />
          </View>
        ))}
        <Cell b={TRANSPORT_SUBTOTAL_LABEL} text="小　計" />
        <Cell b={TRANSPORT_SUBTOTAL} text={d.transportSubtotal ? yen(d.transportSubtotal) : ""} align="right" pad={2} />

        {/* 宿泊費 */}
        {LODGING_ROWS.map((r, i) => (
          <View key={`lo${i}`}>
            <Cell b={r.name} text={d.lodging[i]?.name ?? ""} align="left" pad={2} />
            <Cell b={r.nights} text={d.lodging[i] && d.lodging[i].nights ? String(d.lodging[i].nights) : ""} />
            <Cell b={r.amount} text={d.lodging[i] ? yen(d.lodging[i].amount) : ""} align="right" pad={2} />
          </View>
        ))}
        <Cell b={LODGING_SUBTOTAL_LABEL} text="小　計" />
        <Cell b={LODGING_SUBTOTAL} text={d.lodgingSubtotal ? yen(d.lodgingSubtotal) : ""} align="right" pad={2} />

        {/* 日当 */}
        {ALLOWANCE_ROWS.map((r, i) => (
          <View key={`al${i}`}>
            <Cell b={r.days} text={d.allowance[i] && d.allowance[i].days ? String(d.allowance[i].days) : ""} />
            <Cell b={r.amount} text={d.allowance[i] ? yen(d.allowance[i].amount) : ""} align="right" pad={2} />
          </View>
        ))}
        <Cell b={ALLOWANCE_SUBTOTAL_LABEL} text="小　計" />
        <Cell b={ALLOWANCE_SUBTOTAL} text={d.allowanceSubtotal ? yen(d.allowanceSubtotal) : ""} align="right" pad={2} />

        {/* 精算合計 */}
        <Cell b={TOTAL_LABEL} text="精算合計" />
        <Cell b={TOTAL_VALUE} text={yen(d.total)} />

        {/* 承認欄：役職名は常に表示。氏名または承認印は、承認済みのときだけ */}
        {slots.map((s, i) => {
          const head: Box = { x: s.x, y: APPROVAL_Y0, w: s.w, h: APPROVAL_HEADER_H }
          const body: Box = { x: s.x, y: APPROVAL_Y0 + APPROVAL_HEADER_H, w: s.w, h: APPROVAL_H - APPROVAL_HEADER_H }
          const stampSize = Math.min(s.w - 3, body.h - 5)
          return (
            <View key={`ap${i}`}>
              <Cell b={head} text={s.item.positionName ?? s.item.stage} max={FONT.approvalHead} min={5} />
              {s.item.approved && s.item.stampUrl && (
                <Image src={s.item.stampUrl} style={{
                  position: "absolute", left: P(body.x + (body.w - stampSize) / 2), top: P(body.y + 0.8),
                  width: P(stampSize), height: P(stampSize), objectFit: "contain",
                }} />
              )}
              {s.item.approved && !s.item.stampUrl && (
                <Cell b={{ ...body, h: body.h - 4.5 }} text={s.item.approverName ?? ""} max={FONT.approvalName} min={5} />
              )}
              {s.item.approved && s.item.dateText && (
                <Cell b={{ x: body.x, y: body.y + body.h - 4.5, w: body.w, h: 4.5 }} text={s.item.dateText} max={FONT.approvalDate} min={5} />
              )}
            </View>
          )
        })}
      </Page>
    </Document>
  )
}
