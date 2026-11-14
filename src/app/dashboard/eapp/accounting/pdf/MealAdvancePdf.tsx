import { Document, Page, View, Text, Image, Svg, Line, Rect, G } from "@react-pdf/renderer"
import {
  PAGE_W_MM, PAGE_H_MM, LINES, LINE_WIDTH_MM, FONT, MEAL_KINDS, mw,
  TITLE, SLIP_NO, DATE_LABEL, DATE_VALUE, DEPT_LABEL, DEPT_VALUE, CODE_LABEL, CODE_VALUE, NAME_LABEL, NAME_VALUE,
  SEAL_LABEL, PURPOSE_LABEL, PURPOSE_VALUE,
  APPROVAL_Y0, APPROVAL_H, APPROVAL_HEADER_H, APPROVAL_SLOT_W,
  APPROVAL_TITLE_ACCOUNTING, APPROVAL_TITLE_REQUESTER, APPROVAL_GROUP_ACCOUNTING, APPROVAL_GROUP_REQUESTER,
  MEAL_A, MEAL_B, OTHER_HEAD, OTHER_HEAD_AMOUNT, OTHER_HEAD_ACCOUNT, OTHER_HEAD_CATEGORY, OTHER_ROWS,
  REMARKS, SUBTOTAL, SUBTOTAL_NOTE, ADVANCE, ADVANCE_NOTE, SHORTAGE, BALANCE, BALANCE_NOTE, SHORT_ACCOUNT_LABEL, SHORT_ACCOUNT,
} from "@/lib/accounting-meal-advance-layout"
import { fitText, fitParagraph, yen } from "@/lib/accounting-trip-layout"
import type { Box } from "@/lib/accounting-trip-layout"
import type { TripPdfApproval } from "./TripExpensePdf"

const P = (mm: number) => (mm * 72) / 25.4 // mm → pt
const PT_MM = 25.4 / 72
// Noto Sans CJK JP は、行の上端から約0.8em下に漢字の絵の中心が来る（TripExpensePdf.tsx と同じ補正値）
const INK_CENTER = 0.81

export type MealPdfApproval = TripPdfApproval

export type MealPdfMeal = {
  payee: string
  address: string
  mealDate: string // YYYY-MM-DD
  tel: string
  kind: string
  headcount: number
  participants: string
  amount: number
  accountName: string
  accountCode: string
  taxCategory: string
}

export type MealPdfOther = {
  item: string
  amount: number
  accountName: string
  accountCode: string
  taxCategory: string
}

export type MealPdfData = {
  slipNo: number
  slipDate: string // YYYY-MM-DD
  requesterName: string
  departmentCode: string | null
  departmentName: string | null
  purpose: string | null
  remarks: string | null
  meals: MealPdfMeal[] // 飲食費A・B（最大2件）
  others: MealPdfOther[] // その他C・D・E（最大3件）
  subtotal: number
  advance: number
  shortage: number
  balance: number
  shortageAccountName: string | null
  approvals: MealPdfApproval[] // 承認の順（最初の承認者が先頭）
}

type Align = "left" | "center" | "right"
type MealBlock = typeof MEAL_A

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦"]
const LEGEND = "種別　①居酒屋 ②ファミレス ③喫茶店 ④寿司屋 ⑤焼肉 ⑥ちゃんこ ⑦その他"

// 令和の日付（2019年が令和1年）
const fmtReiwa = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
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
function Para({ b, text, max = FONT.body, min = 5.5, valign = "middle", pad = 1.2 }: {
  b: Box; text: string; max?: number; min?: number; valign?: "top" | "middle"; pad?: number
}) {
  if (!text) return null
  const f = fitParagraph(text, b.w - pad * 2, b.h - 2, max, min)
  const pitch = f.size * PT_MM * 1.35
  const start = valign === "top" ? b.y + 1 : b.y + (b.h - f.lines.length * pitch) / 2
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

// 縦に並べる見出し（飲食費A など）。1文字ずつ、高さを等分した箱に置く
function VLabel({ b, chars }: { b: Box; chars: string[] }) {
  const h = b.h / chars.length
  return (
    <>
      {chars.map((c, i) => <Cell key={i} b={{ x: b.x, y: b.y + i * h, w: b.w, h }} text={c} max={FONT.label} min={6} pad={0} />)}
    </>
  )
}

// 「小計」「仮払金」などの、見出しと金額
function SumRow({ b, label, value }: { b: Box; label: string; value: string }) {
  const lw = mw(95)
  return (
    <>
      <Cell b={{ ...b, w: lw }} text={label} max={FONT.label} align="left" pad={1.5} />
      <Cell b={{ ...b, x: b.x + lw, w: b.w - lw }} text={value} align="right" pad={2} />
    </>
  )
}

// 承認欄の枠の位置。最初の承認者がグループの右端に来て、右から左へ詰める
function approvalSlots(list: MealPdfApproval[], group: { left: number; right: number }) {
  const n = list.length
  if (n === 0) return []
  const w = Math.min(APPROVAL_SLOT_W, (group.right - group.left) / n)
  return list.map((item, i) => ({ item, x: group.right - (i + 1) * w, w }))
}

const acctText = (name: string, code: string) => [name, code].filter(Boolean).join("　")

// 飲食費A・Bの1件分
function MealBlockView({ blk, letter, row }: { blk: MealBlock; letter: string; row: MealPdfMeal | undefined }) {
  const hc = blk.headcountRow
  const pr = blk.participantsRow
  const kindIdx = row ? MEAL_KINDS.indexOf(row.kind) : -1
  return (
    <View>
      <Cell b={blk.legend} text={LEGEND} max={7} min={4.5} align="left" pad={1} />
      <Cell b={blk.headAmount} text="金額" max={FONT.label} />
      <Cell b={blk.headAccount} text="勘定科目" max={FONT.label} />
      <Cell b={blk.headCategory} text="区分" max={FONT.label} />
      <VLabel b={blk.sideLabel} chars={["飲", "食", "費", letter]} />
      <Cell b={blk.payeeLabel} text="支払先名" max={FONT.label} />
      <Cell b={blk.kindLabel} text="種別" max={FONT.label} />
      <Cell b={blk.addressLabel} text="住　所" max={FONT.label} />
      <Cell b={blk.dateLabel} text="飲食日" max={FONT.label} />
      <Cell b={blk.telLabel} text="TEL" max={7} />
      <Cell b={{ x: hc.x, y: hc.y, w: mw(112), h: hc.h }} text="参加人数" max={FONT.label} align="left" pad={1} />
      <Cell b={{ x: hc.x + mw(182), y: hc.y, w: mw(30), h: hc.h }} text="名" max={FONT.label} align="left" pad={0.5} />
      <Cell b={{ x: pr.x, y: pr.y, w: mw(112), h: pr.h }} text="参加者名" max={FONT.label} align="left" pad={1} />
      {row && (
        <>
          <Cell b={blk.payee} text={row.payee} align="left" pad={2} />
          <Cell b={blk.kind} text={kindIdx >= 0 ? CIRCLED[kindIdx] : ""} />
          <Cell b={blk.address} text={row.address} align="left" pad={2} />
          <Cell b={blk.date} text={fmtReiwa(row.mealDate)} />
          <Cell b={blk.tel} text={row.tel} />
          <Cell b={blk.amount} text={yen(row.amount)} align="right" pad={2} />
          <Cell b={blk.account} text={acctText(row.accountName, row.accountCode)} />
          <Cell b={blk.category} text={row.taxCategory} />
          <Cell b={{ x: hc.x + mw(118), y: hc.y, w: mw(60), h: hc.h }} text={row.headcount ? String(row.headcount) : ""} align="right" pad={0} />
          <Para b={{ x: pr.x + mw(118), y: pr.y, w: pr.w - mw(124), h: pr.h }} text={row.participants} pad={0.5} />
        </>
      )}
    </View>
  )
}

export default function MealAdvancePdf({ data }: { data: MealPdfData }) {
  const d = data
  const slots = [
    ...approvalSlots(d.approvals.filter(a => a.stage === "起案部"), APPROVAL_GROUP_REQUESTER),
    ...approvalSlots(d.approvals.filter(a => a.stage !== "起案部"), APPROVAL_GROUP_ACCOUNTING),
  ]

  return (
    <Document>
      <Page size={[P(PAGE_W_MM), P(PAGE_H_MM)]} style={{ fontFamily: "NotoSansJP", color: "#000" }}>
        {/* 罫線と承認欄の枠 */}
        <Svg viewBox={`0 0 ${PAGE_W_MM} ${PAGE_H_MM}`} width={P(PAGE_W_MM)} height={P(PAGE_H_MM)} style={{ position: "absolute", left: 0, top: 0 }}>
          {LINES.map((l, i) => <Line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#000" strokeWidth={LINE_WIDTH_MM} strokeLinecap="square" />)}
          {slots.map((s, i) => (
            <G key={`a${i}`}>
              <Rect x={s.x} y={APPROVAL_Y0} width={s.w} height={APPROVAL_H} fill="none" stroke="#000" strokeWidth={LINE_WIDTH_MM} />
              <Line x1={s.x} y1={APPROVAL_Y0 + APPROVAL_HEADER_H} x2={s.x + s.w} y2={APPROVAL_Y0 + APPROVAL_HEADER_H} stroke="#000" strokeWidth={LINE_WIDTH_MM} />
            </G>
          ))}
        </Svg>

        {/* タイトルと伝票番号 */}
        <Cell b={TITLE} text="飲食費及び仮払精算書" max={16} min={11} pad={0.5} />
        <Cell b={SLIP_NO} text={`伝票番号 ${d.slipNo}`} max={FONT.small} align="right" pad={0} />

        {/* 上の枠 */}
        <Cell b={DATE_LABEL} text="精算日" max={FONT.label} />
        <Cell b={DATE_VALUE} text={fmtReiwa(d.slipDate)} max={FONT.label + 1} />
        <Cell b={DEPT_LABEL} text="部　署" max={FONT.label} />
        <Cell b={DEPT_VALUE} text={d.departmentName ?? ""} max={FONT.label + 1} />
        <Cell b={CODE_LABEL} text="部門コード" max={FONT.label} min={5} />
        <Cell b={CODE_VALUE} text={d.departmentCode ?? ""} max={FONT.label + 1} />
        <Cell b={NAME_LABEL} text="氏　名" max={FONT.label} />
        <Cell b={NAME_VALUE} text={d.requesterName} max={FONT.label + 1} />
        <Cell b={SEAL_LABEL} text="本人印" max={FONT.label} />
        <Cell b={PURPOSE_LABEL} text="使途内容" max={FONT.label} align="left" pad={1.5} />
        <Para b={PURPOSE_VALUE} text={d.purpose ?? ""} max={12} min={6} />

        {/* 承認欄の見出し */}
        <Cell b={APPROVAL_TITLE_ACCOUNTING} text="総務経理課" max={FONT.label} />
        <Cell b={APPROVAL_TITLE_REQUESTER} text="当該部" max={FONT.label} />

        {/* 飲食費A・B */}
        <MealBlockView blk={MEAL_A} letter="A" row={d.meals[0]} />
        <MealBlockView blk={MEAL_B} letter="B" row={d.meals[1]} />

        {/* その他精算C・D・E */}
        <Cell b={OTHER_HEAD} text="その他　精算" max={FONT.label} />
        <Cell b={OTHER_HEAD_AMOUNT} text="金額" max={FONT.label} />
        <Cell b={OTHER_HEAD_ACCOUNT} text="勘定科目" max={FONT.label} />
        <Cell b={OTHER_HEAD_CATEGORY} text="区分" max={FONT.label} />
        {OTHER_ROWS.map((r, i) => {
          const o = d.others[i]
          return (
            <View key={`o${i}`}>
              <Cell b={r.letter} text={["C", "D", "E"][i]} max={FONT.label} pad={0} />
              {o && (
                <>
                  <Cell b={r.item} text={o.item} align="left" pad={2} />
                  <Cell b={r.amount} text={yen(o.amount)} align="right" pad={2} />
                  <Cell b={r.account} text={acctText(o.accountName, o.accountCode)} />
                  <Cell b={r.category} text={o.taxCategory} />
                </>
              )}
            </View>
          )
        })}

        {/* 備考と合計 */}
        <Cell b={{ x: REMARKS.x, y: REMARKS.y, w: mw(70), h: mw(34) }} text="備考" max={FONT.label} align="left" pad={1} />
        <Para b={{ x: REMARKS.x + mw(75), y: REMARKS.y, w: REMARKS.w - mw(80), h: REMARKS.h }} text={d.remarks ?? ""} max={11} min={6} />
        <SumRow b={SUBTOTAL} label="小　計" value={yen(d.subtotal)} />
        <Cell b={SUBTOTAL_NOTE} text="①(A+B+C+D+E)" max={9} min={6} align="left" pad={2} />
        <SumRow b={ADVANCE} label="仮払金" value={yen(d.advance)} />
        <Cell b={ADVANCE_NOTE} text="②仮払いのない方は0を記載ください。" max={9} min={6} align="left" pad={2} />
        <SumRow b={SHORTAGE} label="不足金" value={d.shortage > 0 ? yen(d.shortage) : ""} />
        <SumRow b={BALANCE} label="残金" value={d.balance > 0 ? yen(d.balance) : ""} />
        <Cell b={BALANCE_NOTE} text="②－①" max={FONT.label} />
        <Cell b={SHORT_ACCOUNT_LABEL} text="仮払金不足　勘定科目" max={FONT.label} min={6} />
        <Cell b={SHORT_ACCOUNT} text={d.shortageAccountName ?? ""} />

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
