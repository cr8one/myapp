import { Document, Page, View, Text, Image, Svg, Line, Rect } from "@react-pdf/renderer"
import {
  PAGE_W_MM, PAGE_H_MM, LINES, LINE_WIDTH_MM, FONT,
  SLIP_NO, TITLE, SUBTITLE, SUBMIT_DATE,
  APPROVAL_LABEL, APPROVAL_Y0, APPROVAL_H, APPROVAL_SLOT_W,
  APPROVAL_TITLE_PRESIDENT, APPROVAL_TITLE_DEPARTMENT, APPROVAL_GROUP_PRESIDENT, APPROVAL_GROUP_DEPARTMENT,
  APPLICANT_LABEL, APPLICANT_VALUE, APPLICANT_SEAL, CLIENT_LABEL, CLIENT_VALUE, CONTACT_LABEL, CONTACT_VALUE,
  DATE_LABEL, DATE_VALUE, CONTENT_LABEL, CONTENT_VALUE, PLACE_LABEL, PLACE_VALUE, REASON_LABEL, REASON_VALUE,
  BUDGET_LABEL, BUDGET_VALUE, ADVANCE_FLAG, ACTUAL_LABEL, ACTUAL_VALUE, NOTES, NOTE_ROWS,
} from "@/lib/accounting-reception-layout"
import { fitText, fitParagraph, yen } from "@/lib/accounting-trip-layout"
import type { Box } from "@/lib/accounting-trip-layout"
import { stampSizeMm } from "@/lib/pdf-stamp"
import type { TripPdfApproval } from "./TripExpensePdf"

const P = (mm: number) => (mm * 72) / 25.4 // mm → pt
const PT_MM = 25.4 / 72
// Noto Sans CJK JP は、行の上端から約0.8em下に漢字の絵の中心が来る（TripExpensePdf.tsx と同じ補正値）
const INK_CENTER = 0.81
// 罫線の図を、用紙の高さちょうどにすると、「ページに収まらない大きさ」と判定されて、2ページに分かれる。1pt小さくして、1mmの長さは変えない
const SVG_SHRINK_PT = 1

export type ReceptionPdfData = {
  slipNo: number
  slipDate: string // 提出日 YYYY-MM-DD
  requesterName: string
  clientName: string | null
  contactName: string | null
  receptionDate: string | null
  content: string | null
  place: string | null
  reason: string | null
  budgetAmount: number
  advanceNeeded: boolean
  actualAmount: number | null // 実際額（承認が完了したあと、接待のあとに記録する）
  requesterStampUrl: string | null // 申請者の印影（下書きのときは null）
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

// 箱の中に、複数行の文章を置く（文字サイズを下げて収める）
function Para({ b, text, max = FONT.body, min = 7, pad = 1.5 }: { b: Box; text: string; max?: number; min?: number; pad?: number }) {
  if (!text) return null
  const f = fitParagraph(text, b.w - pad * 2, b.h - 2, max, min)
  const pitch = f.size * PT_MM * 1.35
  const start = b.y + (b.h - f.lines.length * pitch) / 2
  return (
    <>
      {f.lines.map((line, i) => {
        const center = start + (i + 0.5) * pitch
        return (
          <View key={i} style={{ position: "absolute", left: P(b.x + pad), width: P(b.w - pad * 2), top: P(center - INK_CENTER * f.size * PT_MM) }}>
            <Text style={{ fontSize: f.size, lineHeight: 1 }}>{line}</Text>
          </View>
        )
      })}
    </>
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

// 承認欄の枠の位置。紙と同じ数の枠を、いつも描く。最初の承認者がグループの右端に来て、右から左へ詰める。承認者が多いときは、人数に合わせて枠を狭める
function approvalSlots(list: TripPdfApproval[], group: { left: number; right: number; slots: number }) {
  const n = Math.max(list.length, group.slots)
  const w = Math.min(APPROVAL_SLOT_W, (group.right - group.left) / n)
  return Array.from({ length: n }, (_, i) => ({ item: list[i] ?? null, x: group.right - (i + 1) * w, w }))
}

export default function ReceptionPdf({ data }: { data: ReceptionPdfData }) {
  const d = data
  // 起案側の承認者は「当該部」の枠、それ以外（この書類専用の設定に登録した社長）は「社長」の枠
  const president = approvalSlots(d.approvals.filter(a => a.stage !== "起案部"), APPROVAL_GROUP_PRESIDENT)
  const department = approvalSlots(d.approvals.filter(a => a.stage === "起案部"), APPROVAL_GROUP_DEPARTMENT)
  const slots = [...president, ...department]
  const budgetText = `¥ ${yen(d.budgetAmount)}`
  const actualText = d.actualAmount != null ? `¥ ${yen(d.actualAmount)}` : ""

  return (
    <Document>
      <Page size={[P(PAGE_W_MM), P(PAGE_H_MM)]} style={{ fontFamily: "NotoSansJP", color: "#000" }}>
        {/* 罫線と承認欄の枠 */}
        <Svg viewBox={`0 0 ${PAGE_W_MM} ${PAGE_H_MM - SVG_SHRINK_PT * PT_MM}`} width={P(PAGE_W_MM)} height={P(PAGE_H_MM) - SVG_SHRINK_PT} style={{ position: "absolute", left: 0, top: 0 }}>
          {LINES.map((l, i) => (
            <Line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#000" strokeWidth={LINE_WIDTH_MM} strokeLinecap="square" />
          ))}
          {slots.map((s, i) => (
            <Rect key={`a${i}`} x={s.x} y={APPROVAL_Y0} width={s.w} height={APPROVAL_H} fill="none" stroke="#000" strokeWidth={LINE_WIDTH_MM} />
          ))}
        </Svg>

        {/* 上の部分 */}
        <Cell b={SLIP_NO} text={`伝票番号 ${d.slipNo}`} max={FONT.small} align="right" pad={0} />
        <Cell b={TITLE} text="御得意先接待承認書" max={FONT.title} min={FONT.title} />
        <Cell b={SUBTITLE} text="（寄附金・慶弔費を含む）" max={FONT.subtitle} />
        <Cell b={SUBMIT_DATE} text={d.slipDate ? `${fmtReiwa(d.slipDate)}提出` : ""} align="left" pad={1} />

        {/* 承認欄。「承認印」は縦に並べる。枠の中は、印影（なければ氏名）だけ */}
        {["承", "認", "印"].map((ch, i) => (
          <Cell key={`al${i}`} b={{ x: APPROVAL_LABEL.x, y: APPROVAL_LABEL.y + (APPROVAL_LABEL.h / 3) * i, w: APPROVAL_LABEL.w, h: APPROVAL_LABEL.h / 3 }} text={ch} max={FONT.label} pad={0} />
        ))}
        <Cell b={APPROVAL_TITLE_PRESIDENT} text="社長" max={FONT.label} />
        <Cell b={APPROVAL_TITLE_DEPARTMENT} text="当該部" max={FONT.label} />
        {slots.map((s, i) => {
          if (!s.item) return null
          const body: Box = { x: s.x, y: APPROVAL_Y0, w: s.w, h: APPROVAL_H }
          return (
            <View key={`ap${i}`}>
              {s.item.approved && s.item.stampUrl && <Stamp b={body} url={s.item.stampUrl} />}
              {s.item.approved && !s.item.stampUrl && <Cell b={body} text={s.item.approverName ?? ""} max={FONT.approvalName} min={5} />}
            </View>
          )
        })}

        {/* 主表 */}
        <Cell b={APPLICANT_LABEL} text="申請者" max={FONT.label} />
        <Cell b={APPLICANT_VALUE} text={d.requesterName} align="left" pad={3} />
        {d.requesterStampUrl ? <Stamp b={APPLICANT_SEAL} url={d.requesterStampUrl} /> : <Cell b={APPLICANT_SEAL} text="印" max={FONT.label} />}
        <Cell b={CLIENT_LABEL} text="得意先名" max={FONT.label} />
        <Cell b={CLIENT_VALUE} text={d.clientName ?? ""} align="left" pad={3} />
        <Cell b={CONTACT_LABEL} text="氏　名" max={FONT.label} />
        <Cell b={CONTACT_VALUE} text={d.contactName ?? ""} align="left" pad={3} />
        <Cell b={DATE_LABEL} text="接待日" max={FONT.label} />
        <Cell b={DATE_VALUE} text={fmtReiwa(d.receptionDate)} align="left" pad={3} />
        <Cell b={CONTENT_LABEL} text="内　容" max={FONT.label} />
        <Para b={CONTENT_VALUE} text={d.content ?? ""} />
        <Cell b={PLACE_LABEL} text="場　所" max={FONT.label} />
        <Para b={PLACE_VALUE} text={d.place ?? ""} />
        <Cell b={REASON_LABEL} text="理　由" max={FONT.label} />
        <Para b={REASON_VALUE} text={d.reason ?? ""} />
        <Cell b={BUDGET_LABEL} text="予算額" max={FONT.label} />
        <Cell b={BUDGET_VALUE} text={budgetText} align="left" pad={3} />
        <Cell b={ADVANCE_FLAG} text={d.advanceNeeded ? "仮払　要" : "仮払　不要"} align="right" pad={3} />
        <Cell b={ACTUAL_LABEL} text="実際額" max={FONT.label} />
        <Cell b={ACTUAL_VALUE} text={actualText} align="left" pad={3} />

        {/* 注意書き（紙に印字されているもの） */}
        {NOTES.map((line, i) => (
          <Cell key={`n${i}`} b={NOTE_ROWS[i]} text={line} max={FONT.note} min={7} align="left" pad={0} />
        ))}
      </Page>
    </Document>
  )
}
