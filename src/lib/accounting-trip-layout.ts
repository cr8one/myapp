// 出張旅費精算書（出金伝票）の紙様式のレイアウト定義。
// 見本画像（1808×1186px）の罫線を実測した値（px）を、A5横（210×148mm）のmmに変換して持つ。
// PDFは、必ずこの定義を読む（罫線と文字の位置をそろえるため）。

export const PAGE_W_MM = 210
export const PAGE_H_MM = 148

// 表の幅（見本で1599px）を190mm（左右の余白は各10mm）に合わせる縮尺
const SCALE = 190 / 1599 // 1pxあたりのmm
const X0 = 47 // 表の左端（px）
const Y0 = 67 // タイトルの上端（px）
const LEFT_MM = 10
const TOP_MM = 11

export const mx = (px: number) => LEFT_MM + (px - X0) * SCALE
export const my = (py: number) => TOP_MM + (py - Y0) * SCALE
export const mw = (px: number) => px * SCALE

export type Box = { x: number; y: number; w: number; h: number } // 単位はmm
export type Seg = { x1: number; y1: number; x2: number; y2: number } // 単位はmm

// px座標の四角形から、mmの箱を作る
export const box = (x0: number, y0: number, x1: number, y1: number): Box => ({
  x: mx(x0), y: my(y0), w: mw(x1 - x0), h: mw(y1 - y0),
})

export const LINE_WIDTH_MM = 0.36 // 見本の罫線（3px）
export const CYAN = "#D6FEFE"

// 罫線（px）。[x1, y1, x2, y2]
const LINES_PX: [number, number, number, number][] = [
  // 上の枠（左：勘定科目・課税区分）
  [47, 163, 608, 163], [47, 208, 608, 208], [47, 253, 608, 253],
  [47, 163, 47, 253], [437, 163, 437, 253], [608, 163, 608, 253],
  // 上の枠（右：部署・氏名）
  [662, 163, 1637, 163], [662, 208, 1637, 208], [662, 253, 1637, 253],
  [662, 163, 662, 253], [845, 163, 845, 253], [1637, 163, 1637, 253],
  // 本体の横線。左の列は、「出張区域・用」を1つの枠にするため、613から下の線を引かない
  [47, 271, 1646, 271], [47, 328, 1646, 328], [47, 385, 1646, 385], [47, 442, 1646, 442],
  [47, 499, 1646, 499], [47, 556, 1646, 556],
  [530, 613, 1646, 613], [530, 670, 1646, 670], [530, 727, 1646, 727],
  [530, 784, 1646, 784], [530, 841, 1646, 841],
  [47, 898, 1646, 898],
  // 本体の縦線
  [47, 271, 47, 898], [530, 271, 530, 898], [1139, 271, 1139, 898], [1646, 271, 1646, 898],
  [200, 328, 200, 499], [368, 385, 368, 499],
  [953, 328, 953, 898],
  [1373, 328, 1373, 613], [1475, 328, 1475, 613],
  [1406, 670, 1406, 898],
  // 精算合計
  [1145, 919, 1566, 919], [1145, 985, 1566, 985],
  [1145, 919, 1145, 985], [1355, 919, 1355, 985], [1566, 919, 1566, 985],
]

export const LINES: Seg[] = LINES_PX.map(([x1, y1, x2, y2]) => ({ x1: mx(x1), y1: my(y1), x2: mx(x2), y2: my(y2) }))

// 水色の塗り
export const FILLS: Box[] = [
  box(47, 271, 530, 328), box(530, 271, 1139, 328), box(1139, 271, 1646, 328), // 出張期間・交通費・宿泊費の見出し
  box(47, 499, 530, 556), // 出張区域・用の見出し
  box(1139, 613, 1646, 670), // 日当の見出し
  box(1145, 919, 1355, 985), // 精算合計のラベル
]

// 本体の行の位置（px）
const ROW = [271, 328, 385, 442, 499, 556, 613, 670, 727, 784, 841, 898]

export const TITLE = box(75, 60, 900, 118)
export const DATE_LINE = box(1180, 60, 1646, 112)
export const SLIP_NO = box(1380, 22, 1646, 58)

// 上の枠
export const ACCOUNT_LABEL = box(47, 163, 437, 208)
export const TAX_LABEL = box(437, 163, 608, 208)
export const ACCOUNT_VALUE = box(47, 208, 437, 253)
export const TAX_VALUE = box(437, 208, 608, 253)
export const DEPT_LABEL = box(662, 163, 845, 208)
export const DEPT_VALUE = box(845, 163, 1637, 208)
export const NAME_LABEL = box(662, 208, 845, 253)
export const NAME_VALUE = box(845, 208, 1637, 253)

// 見出し
export const HEAD_TRIP = box(47, ROW[0], 530, ROW[1])
export const HEAD_TRANSPORT = box(530, ROW[0], 1139, ROW[1])
export const HEAD_LODGING = box(1139, ROW[0], 1646, ROW[1])
export const SUB_DATE = box(47, ROW[1], 200, ROW[2])
export const SUB_TIME = box(200, ROW[1], 530, ROW[2])
export const SUB_SECTION = box(530, ROW[1], 953, ROW[2])
export const SUB_AMOUNT = box(953, ROW[1], 1139, ROW[2])
export const SUB_LODGING_NAME = box(1139, ROW[1], 1373, ROW[2])
export const SUB_NIGHTS = box(1373, ROW[1], 1475, ROW[2])
export const SUB_LODGING_AMOUNT = box(1475, ROW[1], 1646, ROW[2])

// 出張期間（2行：現地到着・現地出発）
export const TRIP_ROWS = [0, 1].map(i => ({
  date: box(47, ROW[2 + i], 200, ROW[3 + i]),
  label: box(200, ROW[2 + i], 368, ROW[3 + i]),
  time: box(368, ROW[2 + i], 530, ROW[3 + i]),
}))

// 出張区域・用（見出しと、1つの大きな枠）
export const HEAD_AREA = box(47, ROW[4], 530, ROW[5])
export const AREA_TEXT = box(47, ROW[5], 530, ROW[11])

// 交通費（8行）と小計
export const TRANSPORT_ROWS = Array.from({ length: 8 }, (_, i) => ({
  section: box(530, ROW[2] + 57 * i, 953, ROW[2] + 57 * (i + 1)),
  amount: box(953, ROW[2] + 57 * i, 1139, ROW[2] + 57 * (i + 1)),
}))
export const TRANSPORT_SUBTOTAL_LABEL = box(530, ROW[10], 953, ROW[11])
export const TRANSPORT_SUBTOTAL = box(953, ROW[10], 1139, ROW[11])

// 宿泊費（3行）と小計
export const LODGING_ROWS = Array.from({ length: 3 }, (_, i) => ({
  name: box(1139, ROW[2 + i], 1373, ROW[3 + i]),
  nights: box(1373, ROW[2 + i], 1475, ROW[3 + i]),
  amount: box(1475, ROW[2 + i], 1646, ROW[3 + i]),
}))
export const LODGING_SUBTOTAL_LABEL = box(1139, ROW[5], 1373, ROW[6])
export const LODGING_SUBTOTAL = box(1475, ROW[5], 1646, ROW[6])

// 日当（見出し・項目名・2行・小計）
export const HEAD_ALLOWANCE = box(1139, ROW[6], 1646, ROW[7])
export const SUB_DAYS = box(1139, ROW[7], 1406, ROW[8])
export const SUB_ALLOWANCE_AMOUNT = box(1406, ROW[7], 1646, ROW[8])
export const ALLOWANCE_ROWS = [0, 1].map(i => ({
  days: box(1139, ROW[8 + i], 1406, ROW[9 + i]),
  amount: box(1406, ROW[8 + i], 1646, ROW[9 + i]),
}))
export const ALLOWANCE_SUBTOTAL_LABEL = box(1139, ROW[10], 1406, ROW[11])
export const ALLOWANCE_SUBTOTAL = box(1406, ROW[10], 1646, ROW[11])

// 精算合計
export const TOTAL_LABEL = box(1145, 919, 1355, 985)
export const TOTAL_VALUE = box(1355, 919, 1566, 985)

// 承認欄。左の4枠（起案側）と右の5枠（経理側）。枠の数は、実際の承認ステップの数に合わせる
export const APPROVAL_Y0 = my(1003)
export const APPROVAL_H = mw(1150 - 1003)
export const APPROVAL_SLOT_W = mw(159)
export const APPROVAL_GROUP_REQUESTER = { left: mx(173), right: mx(809), slots: 4 }
export const APPROVAL_GROUP_ACCOUNTING = { left: mx(839), right: mx(1634), slots: 5 }
export const APPROVAL_HEADER_H = 5.2 // 役職名を載せる上の帯の高さ（mm）

// 文字サイズ（pt）
export const FONT = { title: 15, body: 12, small: 7.5, label: 11, approvalHead: 7, approvalName: 9, approvalDate: 6.5 }

// 入力の上限（枠に収まる文字数）
export const LIMIT = { section: 20, lodgingName: 12, areaPurpose: 200 }

// ---- 文字の幅の見積もり（折り返しと、枠に収める文字サイズの計算に使う） ----
const PT_MM = 25.4 / 72
export const textWidthEm = (s: string): number => {
  let w = 0
  for (const c of s) {
    const code = c.codePointAt(0) ?? 0
    if (code < 0x80) w += /[0-9]/.test(c) ? 0.58 : /[,.:]/.test(c) ? 0.3 : /[A-Z]/.test(c) ? 0.66 : 0.56
    else if (code >= 0xff61 && code <= 0xff9f) w += 0.5 // 半角カナ
    else w += 1
  }
  return w
}

// 1行の文字を、枠の幅に収める。収まらなければ文字サイズを下げ、下限でも収まらなければ「…」で切る
export function fitText(text: string, widthMm: number, maxPt: number, minPt: number): { text: string; size: number } {
  const avail = widthMm * 0.94
  const need = textWidthEm(text)
  if (need === 0) return { text, size: maxPt }
  const size = Math.min(maxPt, avail / (need * PT_MM))
  if (size >= minPt) return { text, size: Math.round(size * 10) / 10 }
  let cut = text
  while (cut.length > 1 && textWidthEm(cut + "…") * minPt * PT_MM > avail) cut = cut.slice(0, -1)
  return { text: cut + "…", size: minPt }
}

const NO_LINE_START = "、。，．）」』】!?！？ー"
// 複数行の文章を、枠の幅で折り返す（react-pdfの自動の折り返しは日本語で崩れるため、手で行に分ける）
export function wrapLines(text: string, widthMm: number, pt: number): string[] {
  const avail = widthMm * 0.94
  const lines: string[] = []
  for (const para of text.split(/\r?\n/)) {
    let cur = ""
    for (const c of para) {
      const next = cur + c
      if (cur && textWidthEm(next) * pt * PT_MM > avail && !NO_LINE_START.includes(c)) {
        lines.push(cur)
        cur = c
      } else cur = next
    }
    lines.push(cur)
  }
  return lines
}

// 大きな枠に、文章を収める。文字サイズを下げて収め、下限でも収まらなければ「…」で切る
export function fitParagraph(text: string, widthMm: number, heightMm: number, maxPt: number, minPt: number) {
  for (let pt = maxPt; pt >= minPt - 0.01; pt -= 0.5) {
    const lines = wrapLines(text, widthMm, pt)
    if (lines.length * pt * PT_MM * 1.35 <= heightMm) return { lines, size: pt }
  }
  const pt = minPt
  const max = Math.max(1, Math.floor(heightMm / (pt * PT_MM * 1.35)))
  const lines = wrapLines(text, widthMm, pt).slice(0, max)
  lines[lines.length - 1] = lines[lines.length - 1].replace(/.?$/, "…")
  return { lines, size: pt }
}

// ---- 表示用の整形 ----
export const yen = (n: number) => n.toLocaleString("en-US")
export const fmtMD = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? `${Number(m[2])}月${Number(m[3])}日` : ""
}
export const fmtYMD = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : ""
}
// "17:00" → "午後5:00"
export const fmtTime = (s: string) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s)
  if (!m) return ""
  const h = Number(m[1])
  return `${h < 12 ? "午前" : "午後"}${h % 12 === 0 && h >= 12 ? 12 : h % 12}:${m[2]}`
}
