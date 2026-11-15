import { Document, Page, View, Text, Image, Svg, Line, Rect, G } from "@react-pdf/renderer"
import {
  PAGE_W_MM, PAGE_H_MM, LINE_WIDTH_MM, FONT, REQUEST, RECEIPT, CUT_LINES, CUT_LABEL,
  APPROVAL_Y0, APPROVAL_H, APPROVAL_HEADER_H, APPROVAL_SLOT_W,
  APPROVAL_TITLE_ACCOUNTING, APPROVAL_TITLE_REQUESTER, APPROVAL_GROUP_ACCOUNTING, APPROVAL_GROUP_REQUESTER,
} from "@/lib/accounting-advance-request-layout"
import { fitText, wrapLines, yen } from "@/lib/accounting-trip-layout"
import type { Box } from "@/lib/accounting-trip-layout"
import { stampSizeMm } from "@/lib/pdf-stamp"
import type { TripPdfApproval } from "./TripExpensePdf"

const P = (mm: number) => (mm * 72) / 25.4 // mm → pt
const PT_MM = 25.4 / 72
// Noto Sans CJK JP は、行の上端から約0.8em下に漢字の絵の中心が来る（TripExpensePdf.tsx と同じ補正値）
const INK_CENTER = 0.81

export type AdvancePdfData = {
  slipNo: number
  slipDate: string // YYYY-MM-DD
  requesterName: string
  departmentName: string | null
  purpose: string | null
  dueDate: string | null // 精算予定日
  amount: number // 仮払金額
  paidDate: string | null
  paidMethod: string | null
  paidAmount: number | null
  receivedDate: string | null
  requestStampUrl: string | null // 請求印（起案者の印影。下書きのときは null）
  paidStampUrl: string | null // 支払済印（支払を記録した経理の印影）
  receiptStampUrl: string | null // 受領印（受領を記録した起案者の印影）
  approvals: TripPdfApproval[] // 承認の順（最初の承認者が先頭）
}

type Align = "left" | "center" | "right"

// 令和の日付（2019年が令和1年）
const fmtReiwa = (s: string | null) => {
  const m = s ? /^(\d{4})-(\d{2})-(\d{2})/.exec(s) : null
  if (!m) return ""
  const y = Number(m[1]) - 2018
  return y >= 1 ? `令和${y}年${Number(m[2])}月${Number(m[3])}日` : `${m[1]}年${Number(m[2])}月${Number(m[3])}日`
}

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

// 印影の画像を、箱の中央に、直径9.5mmで置く
function Stamp({ b, url }: { b: Box; url: string }) {
  const size = stampSizeMm(b.w, b.h)
  return (
    <Image src={url} style={{
      position: "absolute", left: P(b.x + (b.w - size) / 2), top: P(b.y + (b.h - size) / 2),
      width: P(size), height: P(size), objectFit: "contain",
    }} />
  )
}

// 承認欄の枠の位置。紙の様式と同じ数の枠を、いつも描く。最初の承認者がグループの右端に来て、右から左へ詰める。承認者が多いときは、人数に合わせて枠を狭める
function approvalSlots(list: TripPdfApproval[], group: { left: number; right: number; slots: number }) {
  const n = Math.max(list.length, group.slots)
  const w = Math.min(APPROVAL_SLOT_W, (group.right - group.left) / n)
  return Array.from({ length: n }, (_, i) => ({ item: list[i] ?? null, x: group.right - (i + 1) * w, w }))
}

export default function AdvanceRequestPdf({ data }: { data: AdvancePdfData }) {
  const d = data
  const slots = [
    ...approvalSlots(d.approvals.filter(a => a.stage === "起案部"), APPROVAL_GROUP_REQUESTER),
    ...approvalSlots(d.approvals.filter(a => a.stage !== "起案部"), APPROVAL_GROUP_ACCOUNTING),
  ]
  const amountText = `¥ ${yen(d.amount)}`
  const purposeLines = d.purpose ? wrapLines(d.purpose, REQUEST.purposeRows[0].w - 2, FONT.body).slice(0, 8) : []
  const slipNoText = `伝票番号 ${d.slipNo}`

  return (
    <Document>
      <Page size={[P(PAGE_W_MM), P(PAGE_H_MM)]} style={{ fontFamily: "NotoSansJP", color: "#000" }}>
        {/* 罫線と承認欄の枠 */}
        <Svg viewBox={`0 0 ${PAGE_W_MM} ${PAGE_H_MM}`} width={P(PAGE_W_MM)} height={P(PAGE_H_MM)} style={{ position: "absolute", left: 0, top: 0 }}>
          {[...REQUEST.lines, ...RECEIPT.lines].map((l, i) => (
            <Line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#000" strokeWidth={LINE_WIDTH_MM} strokeLinecap="square" />
          ))}
          {CUT_LINES.map((l, i) => (
            <Line key={`c${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#000" strokeWidth={0.25} strokeDasharray="2 1.5" />
          ))}
          {slots.map((s, i) => (
            <G key={`a${i}`}>
              <Rect x={s.x} y={APPROVAL_Y0} width={s.w} height={APPROVAL_H} fill="none" stroke="#000" strokeWidth={LINE_WIDTH_MM} />
              <Line x1={s.x} y1={APPROVAL_Y0 + APPROVAL_HEADER_H} x2={s.x + s.w} y2={APPROVAL_Y0 + APPROVAL_HEADER_H} stroke="#000" strokeWidth={LINE_WIDTH_MM} />
            </G>
          ))}
        </Svg>

        <Cell b={CUT_LABEL} text="切り取り線" max={FONT.small} />

        {/* 請求書（上半分） */}
        <Cell b={REQUEST.title} text="仮払金請求書" max={FONT.title} min={FONT.title} />
        <Cell b={REQUEST.dateLabel} text="日　付" max={FONT.label} />
        <Cell b={REQUEST.dateValue} text={fmtReiwa(d.slipDate)} align="left" pad={2} />
        <Cell b={REQUEST.deptLabel} text="部　署" max={FONT.label} />
        <Cell b={REQUEST.deptValue} text={d.departmentName ?? ""} align="left" pad={2} />
        <Cell b={REQUEST.nameLabel} text="氏　名" max={FONT.label} />
        <Cell b={REQUEST.nameValue} text={d.requesterName} align="left" pad={2} />
        {d.requestStampUrl ? <Stamp b={REQUEST.seal} url={d.requestStampUrl} /> : <Cell b={REQUEST.seal} text="印" max={FONT.label} />}
        <Cell b={REQUEST.text} text="下記の金額を請求します。" max={FONT.body} align="left" pad={2} />
        <Cell b={REQUEST.dueLabel} text="精算予定日" max={FONT.label} />
        <Cell b={REQUEST.dueValue} text={fmtReiwa(d.dueDate)} align="left" pad={2} />
        <Cell b={REQUEST.amountLabel} text="仮払金額" max={FONT.label} />
        <Cell b={REQUEST.amountValue} text={amountText} align="left" pad={2} />
        <Cell b={REQUEST.purposeHead} text="使途内容" max={FONT.label} align="left" pad={2} />
        {purposeLines.map((line, i) => (
          <Cell key={`p${i}`} b={REQUEST.purposeRows[i]} text={line} align="left" pad={1} />
        ))}
        <Cell b={REQUEST.slipNo} text={slipNoText} max={FONT.small} align="left" pad={2} />

        {/* 承認欄 */}
        <Cell b={APPROVAL_TITLE_ACCOUNTING} text="経理課" max={FONT.label} />
        <Cell b={APPROVAL_TITLE_REQUESTER} text="当該部" max={FONT.label} />
        {slots.map((s, i) => {
          if (!s.item) return null
          const head: Box = { x: s.x, y: APPROVAL_Y0, w: s.w, h: APPROVAL_HEADER_H }
          const body: Box = { x: s.x, y: APPROVAL_Y0 + APPROVAL_HEADER_H, w: s.w, h: APPROVAL_H - APPROVAL_HEADER_H }
          return (
            <View key={`ap${i}`}>
              <Cell b={head} text={s.item.positionName ?? s.item.stage} max={FONT.approvalHead} min={5} />
              {s.item.approved && s.item.stampUrl && <Stamp b={body} url={s.item.stampUrl} />}
              {s.item.approved && !s.item.stampUrl && <Cell b={body} text={s.item.approverName ?? ""} max={FONT.approvalName} min={5} />}
            </View>
          )
        })}

        {/* 受領書（下半分） */}
        <Cell b={RECEIPT.title} text="仮払金受領書" max={FONT.title} min={FONT.title} />
        <Cell b={RECEIPT.dateLabel} text="受領日" max={FONT.label} />
        <Cell b={RECEIPT.dateValue} text={fmtReiwa(d.receivedDate)} align="left" pad={2} />
        <Cell b={RECEIPT.deptLabel} text="部　署" max={FONT.label} />
        <Cell b={RECEIPT.deptValue} text={d.departmentName ?? ""} align="left" pad={2} />
        <Cell b={RECEIPT.nameLabel} text="氏　名" max={FONT.label} />
        <Cell b={RECEIPT.nameValue} text={d.requesterName} align="left" pad={2} />
        {d.receiptStampUrl ? <Stamp b={RECEIPT.seal} url={d.receiptStampUrl} /> : <Cell b={RECEIPT.seal} text="受領印" max={FONT.small} />}
        <Cell b={RECEIPT.text} text="下記の金額を受領しました。" max={FONT.body} align="left" pad={2} />
        <Cell b={RECEIPT.amountLabel} text="仮払金額" max={FONT.label} />
        <Cell b={RECEIPT.amountValue} text={amountText} align="left" pad={2} />
        <Cell b={RECEIPT.dueLabel} text="精算予定日" max={FONT.label} />
        <Cell b={RECEIPT.dueValue} text={fmtReiwa(d.dueDate)} align="left" pad={2} />
        <Cell b={RECEIPT.payHead} text="支払の記録（経理）" max={FONT.label} align="left" pad={2} />
        <Cell b={RECEIPT.paidDateLabel} text="支払日" max={FONT.label} />
        <Cell b={RECEIPT.paidDateValue} text={fmtReiwa(d.paidDate)} align="left" pad={2} />
        <Cell b={RECEIPT.paidMethodLabel} text="支払方法" max={FONT.label} />
        <Cell b={RECEIPT.paidMethodValue} text={d.paidMethod ?? ""} align="left" pad={2} />
        <Cell b={RECEIPT.paidAmountLabel} text="支払額" max={FONT.label} />
        <Cell b={RECEIPT.paidAmountValue} text={d.paidAmount != null ? `¥ ${yen(d.paidAmount)}` : ""} align="left" pad={2} />
        {d.paidStampUrl ? <Stamp b={RECEIPT.paidStamp} url={d.paidStampUrl} /> : <Cell b={RECEIPT.paidStamp} text="支払済印" max={FONT.small} />}
        <Cell b={RECEIPT.slipNo} text={slipNoText} max={FONT.small} align="left" pad={2} />
      </Page>
    </Document>
  )
}
