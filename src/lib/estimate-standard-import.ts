// FileMakerの基準（見積基準_SP）を、新しい基準マスタの形に変換して取り込む。
// 対応表は、FileMaker側の見積書の式（加単計算、印通計算、損通計算、表加通計など）から読み取ったもの。
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

// 現行の式：加工単価が750以上なら「一式」（数量1）として扱う
export const LUMP_THRESHOLD = 750

// 使っていない枠に入っている印の文字（名前ではない）
const PLACEHOLDER_NAME = "未設定"

// 現行の式（加単計算03〜08）：同じ名前の項目が2つ並ぶ場合、1つ目はオーダー数2,000未満、2つ目は2,000以上
export const SPLIT_AT = 2000

// 一式（または固定値）の判定。表によって基準が違う
const PROCESSING_LUMP = (v: number) => v >= LUMP_THRESHOLD
// 印刷代：現行の式（通し数001）では、印刷代が1,000を超えると通し数を1にする（一式）
const PRINTING_LUMP = (v: number) => v > 1000
// 損紙：1以上は固定の枚数、1未満は通し数に対する率（損通計算のL・M段）。is_lump は「固定の枚数」の意味で使う
const WASTE_FIXED = (v: number) => v >= 1

export const SHEETS = [
  { code: "basic", name: "基本", kind: "values", sort_order: 10 },
  { code: "paper", name: "用紙（kg単価）", kind: "list", sort_order: 20 },
  { code: "tray", name: "トレイ代", kind: "list", sort_order: 30 },
  { code: "processing_single", name: "加工代（単独）", kind: "list", sort_order: 40 },
  { code: "processing_split", name: "加工代（数量で切替）", kind: "matrix", sort_order: 45 },
  { code: "processing", name: "加工・製本", kind: "matrix", sort_order: 50 },
  { code: "outer_box", name: "外箱加工", kind: "matrix", sort_order: 60 },
  { code: "printing", name: "印刷代", kind: "matrix", sort_order: 70 },
  { code: "waste", name: "損紙", kind: "matrix", sort_order: 80 },
  { code: "surface", name: "表面加工", kind: "matrix", sort_order: 90 },
] as const
export type SheetCode = (typeof SHEETS)[number]["code"]
const sheetName = (code: string) => SHEETS.find(s => s.code === code)?.name ?? code

export type ParsedValue = { sheet: SheetCode; item: string; value: number | null; is_lump: boolean }
export type ParsedCell = { item: string; value: number | null; is_lump: boolean }
export type ParsedTier = { sheet: SheetCode; lot_from: number; lot_to: number | null; cells: ParsedCell[] }
export type ParsedStandard = {
  name: string
  values: ParsedValue[]
  tiers: ParsedTier[]
  warnings: string[]
  unmapped: string[]
}

type Row = Record<string, unknown>
const nfkc = (s: string) => s.normalize("NFKC")
const pad2 = (n: number) => String(n).padStart(2, "0")

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  const s = String(v).replace(/[,\s　]/g, "")
  if (s === "") return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function toName(v: unknown): string {
  if (v === null || v === undefined) return ""
  return nfkc(String(v)).replace(/\s+/g, " ").trim()
}

// 見出し（フィールド名）の半角・全角などの違いを吸収して値を読む
class RowView {
  private map = new Map<string, string>()
  private used = new Set<string>()
  constructor(private row: Row) {
    for (const k of Object.keys(row)) this.map.set(nfkc(k), k)
  }
  raw(field: string): unknown {
    const k = this.map.get(nfkc(field))
    if (k === undefined) return null
    this.used.add(k)
    return this.row[k]
  }
  num(field: string): number | null {
    return toNum(this.raw(field))
  }
  name(field: string): string {
    return toName(this.raw(field))
  }
  unmappedNonEmpty(): string[] {
    const out: string[] = []
    for (const k of Object.keys(this.row)) {
      if (this.used.has(k)) continue
      const v = this.row[k]
      if (v === null || v === undefined || v === "" || v === 0) continue
      out.push(k)
    }
    return out
  }
}

function uniqueName(name: string, seen: Set<string>, tag: string, warnings: string[], where: string): string {
  if (!seen.has(name)) {
    seen.add(name)
    return name
  }
  let n = `${name}（${tag}）`
  let i = 2
  while (seen.has(n)) n = `${name}（${tag}-${i++}）`
  seen.add(n)
  warnings.push(`${where}：名前「${name}」が重複しているため「${n}」にしました`)
  return n
}

// ---- 対応表（FileMakerの見積書の式から読み取ったもの） ----

// 基本の値（見積書の計算で使われていることを確認済みのもの）
const BASIC_ITEMS = [
  { name: "営業費（新譜）", field: "営業費 新譜" },
  { name: "営業費（旧譜）", field: "営業費 旧譜" },
  { name: "刷版基本料金（菊半才・A3・四六4才）", field: "刷版基本料金01" },
  { name: "刷版基本料金（四六半才・菊全）", field: "刷版基本料金02" },
  { name: "UV刷版基本料金（菊半才・A3・四六4才）", field: "刷版基本料金03" },
  { name: "UV刷版基本料金（四六半才・菊全）", field: "刷版基本料金04" },
  { name: "サンプル代", field: "ｻﾝﾌﾟﾙ代" },
]

// 加工名の番号 → 単価の項目（単独の値）
const SINGLE_SLOTS: { slot: string; field: string }[] = [
  { slot: "29", field: "基準投込み代01" },
  { slot: "30", field: "基準投込み代02" },
  { slot: "31", field: "基準ﾃﾞｼﾞ加工代01A" },
  { slot: "32", field: "基準ﾃﾞｼﾞ加工代01B" },
  { slot: "33", field: "基準ﾃﾞｼﾞ加工代01C" },
  { slot: "34", field: "基準ﾃﾞｼﾞ加工代01D" },
  { slot: "35", field: "基準ﾃﾞｼﾞ加工代02A" },
  { slot: "36", field: "基準ﾃﾞｼﾞ加工代02B" },
  { slot: "37", field: "基準ﾃﾞｼﾞ加工代02C" },
  { slot: "38", field: "基準ﾃﾞｼﾞ加工代02D" },
]

// 単価表の列。名前は、label があればそれを使い、なければ「加工名{slot}」のデータから読む
type MatrixCol = { slot?: string; label?: string; prefix: string }

// 加工・製本：ロット範囲は「加工通し数」。加工基準A〜K、製本基準A〜I、DVD製本基準A〜G
const PROCESSING_COLS: MatrixCol[] = [
  ...["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"].map((slot, i) => ({
    slot,
    prefix: `加工基準${String.fromCharCode(65 + i)}`,
  })),
  { slot: "14", prefix: "製本基準A" },
  { slot: "15", prefix: "製本基準B" },
  { slot: "16", prefix: "製本基準C" },
  { slot: "17", prefix: "製本基準D" },
  { slot: "18", prefix: "製本基準E" },
  { slot: "19", prefix: "製本基準F" },
  { slot: "20", prefix: "製本基準G" },
  { slot: "12", prefix: "製本基準H" },
  { slot: "13", prefix: "製本基準I" },
  { slot: "22", prefix: "DVD製本基準A" },
  { slot: "23", prefix: "DVD製本基準B" },
  { slot: "24", prefix: "DVD製本基準C" },
  { slot: "25", prefix: "DVD製本基準D" },
  { slot: "26", prefix: "DVD製本基準E" },
  { slot: "27", prefix: "DVD製本基準F" },
  { slot: "28", prefix: "DVD製本基準G" },
]

// 外箱：ロット範囲は「DVD外箱ロット」。外箱A〜U
const OUTER_BOX_COLS: MatrixCol[] = [
  "351", "352", "353", "361", "362", "363", "371", "372", "373", "374", "375",
  "376", "377", "378", "379", "380", "381", "382", "383", "384", "385",
].map((slot, i) => ({ slot, prefix: `外箱${String.fromCharCode(65 + i)}` }))

// 印刷代：ロット範囲は「印刷通し数」（15段）。印刷種別 × 版の大きさ（A＝菊半才まで、B＝四六半才・菊全）。名前は画面の見出しに合わせた
const PRINTING_COLS: MatrixCol[] = [
  { label: "薄紙 菊半才・A3・四六4才", prefix: "印刷基準A" },
  { label: "薄紙 四六半才・菊全", prefix: "印刷基準B" },
  { label: "厚紙 菊半才・A3・四六4才", prefix: "厚印刷基準A" },
  { label: "厚紙 四六半才・菊全", prefix: "厚印刷基準B" },
  { label: "UV薄紙 菊半才以下", prefix: "UV印刷基準A" },
  { label: "UV薄紙 四六半才・菊全", prefix: "UV印刷基準B" },
  { label: "UV厚紙 菊半才以下", prefix: "UV厚印刷基準A" },
  { label: "UV厚紙 四六半才・菊全", prefix: "UV厚印刷基準B" },
]

// 損紙：ロット範囲は「損紙通し数」（13段）。A〜Eの意味は、式（表面加工通しN＝通し数＋B＋C＋D）と画面の見出しから
const WASTE_COLS: MatrixCol[] = [
  { label: "印刷1C", prefix: "損紙基準A" },
  { label: "製本", prefix: "損紙基準B" },
  { label: "断裁", prefix: "損紙基準C" },
  { label: "抜き", prefix: "損紙基準D" },
  { label: "表面加工", prefix: "損紙基準E" },
]

// 表面加工：ロット範囲は損紙と同じ「損紙通し数」（13段）。列は、式（PP貼り01〜05など）から読み取った
// 大きさの順：A1/2（菊半才）、B1/2（四六半才）、A全（菊全）、A1/3（菊3才）、B1/4（四六4才）
const SURFACE_SIZES = ["菊半才", "四六半才", "菊全", "菊3才", "四六4才"]
const SURFACE_GROUPS: { family: string; letters: string[] }[] = [
  { family: "PP貼り", letters: ["D", "E", "F", "O", "P"] },
  { family: "マットPP貼り", letters: ["G", "H", "I", "Q", "R"] },
  { family: "サック用PP貼り", letters: ["J", "K", "L", "S", "T"] },
  { family: "サック用マットPP貼り", letters: ["A", "B", "C", "M", "N"] },
]
const SURFACE_COLS: MatrixCol[] = SURFACE_GROUPS.flatMap(g =>
  g.letters.map((letter, i) => ({ label: `${g.family} ${SURFACE_SIZES[i]}`, prefix: `表面加工${letter}` }))
)

// ---- 読み取り ----

function readList(
  rv: RowView,
  sheet: SheetCode,
  w: string[],
  opts: {
    count: number
    nameField: (i: number) => string
    valueField: (i: number) => string
    zeroAsNull?: boolean
    lump?: boolean
  }
): ParsedValue[] {
  const seen = new Set<string>()
  const out: ParsedValue[] = []
  for (let i = 1; i <= opts.count; i++) {
    const name = rv.name(opts.nameField(i))
    let value = rv.num(opts.valueField(i))
    if (opts.zeroAsNull && value === 0) value = null
    if (name === PLACEHOLDER_NAME) continue
    if (!name) {
      if (value !== null && value !== 0) w.push(`${sheetName(sheet)}：${opts.valueField(i)} に値（${value}）があるが、名前がありません`)
      continue
    }
    const item = uniqueName(name, seen, pad2(i), w, `${sheetName(sheet)} ${opts.nameField(i)}`)
    out.push({ sheet, item, value, is_lump: !!opts.lump && value !== null && value >= LUMP_THRESHOLD })
  }
  return out
}

// 加工名29〜38（投込み代・デジ加工代）。同じ名前が2つ並ぶ項目は、数量で切り替える1組として扱う
function readSingleSlots(rv: RowView, w: string[]): { values: ParsedValue[]; tiers: ParsedTier[] } {
  const label = sheetName("processing_single")
  const groups = new Map<string, (number | null)[]>()
  for (const s of SINGLE_SLOTS) {
    const name = rv.name(`加工名${s.slot}`)
    let value = rv.num(s.field)
    if (value === 0) value = null
    if (name === PLACEHOLDER_NAME) continue
    if (!name) {
      if (value !== null) w.push(`${label}：${s.field} に値（${value}）があるが、名前がありません`)
      continue
    }
    const arr = groups.get(name) ?? []
    arr.push(value)
    groups.set(name, arr)
  }

  const values: ParsedValue[] = []
  const split: { name: string; below: number | null; above: number | null }[] = []
  for (const [name, arr] of Array.from(groups.entries())) {
    if (arr.length === 1) {
      const v = arr[0]
      values.push({ sheet: "processing_single", item: name, value: v, is_lump: v !== null && v >= LUMP_THRESHOLD })
      continue
    }
    if (arr.length > 2) w.push(`${label}：「${name}」が${arr.length}つあります。先頭の2つだけを取り込みます`)
    split.push({ name, below: arr[0], above: arr[1] })
  }

  const tiers: ParsedTier[] = []
  if (split.length > 0) {
    const mk = (v: number | null) => ({ value: v, is_lump: v !== null && v >= LUMP_THRESHOLD })
    tiers.push({
      sheet: "processing_split",
      lot_from: 1,
      lot_to: SPLIT_AT - 1,
      cells: split.map(s => ({ item: s.name, ...mk(s.below) })),
    })
    tiers.push({
      sheet: "processing_split",
      lot_from: SPLIT_AT,
      lot_to: null,
      cells: split.map(s => ({ item: s.name, ...mk(s.above) })),
    })
  }
  return { values, tiers }
}

type RawRow = { k: number; from: number | null; to: number | null; cells: ParsedCell[] }

// 単価表の行から、実際に使われる範囲を決める。現行の式の読み方に合わせる。
//  lower：「数量 ≥ 開始」を、後ろの行から順に調べて、最初に合う行を使う（終了の値は使わない）
//  upper：「数量 ≤ 終了」を、前の行から順に調べて、最初に合う行を使う（開始の値は使わない）
function resolveTiers(sheet: SheetCode, rows: RawRow[], bound: "lower" | "upper", w: string[]): ParsedTier[] {
  const label = sheetName(sheet)
  const hasValue = (r: RawRow) => r.cells.some(c => c.value !== null)
  const keyOf = (r: RawRow) => (bound === "lower" ? r.from : r.to)
  const valid = rows.filter(r => keyOf(r) !== null)
  const ignored = rows.filter(r => keyOf(r) === null && hasValue(r)).length
  if (ignored > 0) {
    w.push(`${label}：ロットの区切りが空欄で、値がある行が${ignored}行あります（取り込んでいません）`)
  }

  // 区切りの値ごとに、使われる行を決める。同じ行が続くときは、まとめる
  const points = Array.from(new Set(valid.map(r => Math.round(keyOf(r)!)))).sort((a, b) => a - b)
  const segs: { point: number; row: RawRow }[] = []
  for (const p of points) {
    let win: RawRow | null = null
    for (const r of valid) {
      const v = Math.round(keyOf(r)!)
      if (bound === "lower") {
        if (v <= p && (!win || r.k > win.k)) win = r
      } else {
        if (v >= p && (!win || r.k < win.k)) win = r
      }
    }
    if (!win) continue
    const prev = segs[segs.length - 1]
    if (!prev || prev.row !== win) segs.push({ point: p, row: win })
    else if (bound === "upper") prev.point = p
  }

  const used = new Set(segs.map(s => s.row.k))
  const dead = valid.filter(r => !used.has(r.k) && hasValue(r)).map(r => r.k)
  if (dead.length > 0) {
    const rule = bound === "lower" ? "開始が同じ行は後ろの行が" : "範囲が重なる行は前の行が"
    w.push(`${label}：${dead.join("・")}行目は、現行の式では使われない行のため、取り込んでいません（${rule}使われます）`)
  }

  const tiers: ParsedTier[] = []
  segs.forEach((s, idx) => {
    if (!hasValue(s.row)) return
    if (bound === "lower") {
      const next = segs[idx + 1]
      tiers.push({ sheet, lot_from: s.point, lot_to: next ? next.point - 1 : null, cells: s.row.cells })
    } else {
      const prev = segs[idx - 1]
      tiers.push({ sheet, lot_from: prev ? prev.point + 1 : 1, lot_to: s.point, cells: s.row.cells })
    }
  })
  return tiers
}

function readMatrix(
  rv: RowView,
  sheet: SheetCode,
  w: string[],
  opts: {
    lotPrefix: string
    rows: number
    cols: MatrixCol[]
    lump?: (v: number) => boolean
    bound?: "lower" | "upper"
  }
): ParsedTier[] {
  const label = sheetName(sheet)
  const isLump = opts.lump ?? PROCESSING_LUMP
  const lots: { k: number; from: number | null; to: number | null }[] = []
  for (let k = 1; k <= opts.rows; k++) {
    lots.push({
      k,
      from: rv.num(`${opts.lotPrefix}${pad2(2 * k - 1)}`),
      to: rv.num(`${opts.lotPrefix}${pad2(2 * k)}`),
    })
  }

  // 列：値が1つもない列は取り込まない。名前がない列は警告
  const seen = new Set<string>()
  const usable: { name: string; prefix: string }[] = []
  for (const c of opts.cols) {
    const name = c.label ?? rv.name(`加工名${c.slot}`)
    if (name === PLACEHOLDER_NAME) continue
    const hasValue = lots.some(r => {
      const v = rv.num(`${c.prefix}${pad2(r.k)}`)
      return v !== null && v !== 0
    })
    if (!hasValue) continue
    if (!name) {
      w.push(`${label}：${c.prefix}01〜 に値があるが、名前（加工名${c.slot}）が空欄のため取り込めません`)
      continue
    }
    const where = `${label} ${c.slot ? `加工名${c.slot}` : c.prefix}`
    usable.push({ name: uniqueName(name, seen, c.slot ?? c.prefix, w, where), prefix: c.prefix })
  }

  const rows: RawRow[] = lots.map(r => ({
    k: r.k,
    from: r.from,
    to: r.to,
    cells: usable.map(c => {
      let v = rv.num(`${c.prefix}${pad2(r.k)}`)
      if (v === 0) v = null
      return { item: c.name, value: v, is_lump: v !== null && isLump(v) }
    }),
  }))
  return resolveTiers(sheet, rows, opts.bound ?? "lower", w)
}

export function parseStandardRow(row: Row): ParsedStandard | null {
  const rv = new RowView(row)
  const rawName = rv.raw("基準名")
  const name = rawName === null || rawName === undefined ? "" : String(rawName).trim()
  if (!name) return null
  rv.raw("基準")
  rv.raw("基本")

  const w: string[] = []
  const values: ParsedValue[] = []

  for (const b of BASIC_ITEMS) {
    values.push({ sheet: "basic", item: b.name, value: rv.num(b.field), is_lump: false })
  }
  values.push(
    ...readList(rv, "paper", w, { count: 15, nameField: i => `用紙${pad2(i)}`, valueField: i => `用紙kg単価${pad2(i)}` })
  )
  values.push(
    ...readList(rv, "tray", w, { count: 15, nameField: i => `トレイ名${pad2(i)}`, valueField: i => `トレイ代${pad2(i)}` })
  )

  const single = readSingleSlots(rv, w)
  values.push(...single.values)

  const tiers: ParsedTier[] = [
    ...single.tiers,
    ...readMatrix(rv, "processing", w, { lotPrefix: "加工通し数", rows: 10, cols: PROCESSING_COLS }),
    ...readMatrix(rv, "outer_box", w, { lotPrefix: "DVD外箱ロット", rows: 15, cols: OUTER_BOX_COLS, bound: "upper" }),
    ...readMatrix(rv, "printing", w, { lotPrefix: "印刷通し数", rows: 15, cols: PRINTING_COLS, lump: PRINTING_LUMP }),
    ...readMatrix(rv, "waste", w, { lotPrefix: "損紙通し数", rows: 13, cols: WASTE_COLS, lump: WASTE_FIXED }),
    ...readMatrix(rv, "surface", w, { lotPrefix: "損紙通し数", rows: 13, cols: SURFACE_COLS }),
  ]

  return { name, values, tiers, warnings: w, unmapped: rv.unmappedNonEmpty() }
}

// ---- 書き込み ----

export type ImportResult = {
  name: string
  status: "created" | "replaced" | "skipped"
  values: number
  tiers: number
  cells: number
}

export async function applyImport(
  list: ParsedStandard[],
  overwrite: boolean,
  userId: string | null
): Promise<ImportResult[]> {
  // 1. 表の定義
  const defId = new Map<string, string>()
  for (const s of SHEETS) {
    const d = await prisma.estSheetDef.upsert({
      where: { code: s.code },
      create: { code: s.code, name: s.name, kind: s.kind, sort_order: s.sort_order },
      update: {},
    })
    defId.set(s.code, d.id)
  }

  // 2. 項目：初めて出てきた名前だけ追加する（順番は、出てきた順）
  const names = new Map<string, string[]>()
  const add = (sheet: string, item: string) => {
    const a = names.get(sheet) ?? []
    if (!a.includes(item)) a.push(item)
    names.set(sheet, a)
  }
  for (const p of list) {
    for (const v of p.values) add(v.sheet, v.item)
    for (const t of p.tiers) for (const c of t.cells) add(t.sheet, c.item)
  }
  for (const [sheet, arr] of Array.from(names.entries())) {
    const id = defId.get(sheet)!
    const have = await prisma.estSheetItem.findMany({
      where: { sheet_def_id: id },
      select: { name: true, sort_order: true },
    })
    const haveNames = new Set(have.map(h => h.name))
    let order = have.reduce((m, h) => Math.max(m, h.sort_order), 0)
    const data = arr.filter(n => !haveNames.has(n)).map(n => ({ sheet_def_id: id, name: n, sort_order: (order += 10) }))
    if (data.length > 0) await prisma.estSheetItem.createMany({ data, skipDuplicates: true })
  }
  const items = await prisma.estSheetItem.findMany({ select: { id: true, name: true, sheet_def_id: true } })
  const itemId = new Map(items.map(i => [`${i.sheet_def_id}\u0000${i.name}`, i.id]))
  const itemKey = (sheet: string, name: string) => `${defId.get(sheet)!}\u0000${name}`

  // 3. 基準ごとに書き込む
  const results: ImportResult[] = []
  for (const p of list) {
    const existing = await prisma.estStandard.findUnique({ where: { name: p.name } })
    const vCount = p.values.filter(v => v.value !== null).length
    const cCount = p.tiers.reduce((n, t) => n + t.cells.filter(c => c.value !== null).length, 0)
    if (existing && !overwrite) {
      results.push({ name: p.name, status: "skipped", values: vCount, tiers: p.tiers.length, cells: cCount })
      continue
    }

    const stdId = await prisma.$transaction(
      async tx => {
        const std = existing ?? (await tx.estStandard.create({ data: { name: p.name } }))
        for (const s of SHEETS) {
          const id = defId.get(s.code)!
          await tx.estStandardValue.deleteMany({ where: { standard_id: std.id, item: { sheet_def_id: id } } })
          await tx.estStandardTier.deleteMany({ where: { standard_id: std.id, sheet_def_id: id } })
          await tx.estStandardSheet.upsert({
            where: { standard_id_sheet_def_id: { standard_id: std.id, sheet_def_id: id } },
            create: { standard_id: std.id, sheet_def_id: id, mode: "own" },
            update: { mode: "own" },
          })
        }

        const valueRows = p.values
          .filter(v => v.value !== null)
          .map(v => ({
            standard_id: std.id,
            item_id: itemId.get(itemKey(v.sheet, v.item))!,
            value: v.value,
            is_lump: v.is_lump,
          }))
        if (valueRows.length > 0) await tx.estStandardValue.createMany({ data: valueRows })

        const counters = new Map<string, number>()
        const tierRows = p.tiers.map(t => {
          const n = counters.get(t.sheet) ?? 0
          counters.set(t.sheet, n + 1)
          return {
            id: randomUUID(),
            standard_id: std.id,
            sheet_def_id: defId.get(t.sheet)!,
            lot_from: t.lot_from,
            lot_to: t.lot_to,
            sort_order: n,
          }
        })
        if (tierRows.length > 0) await tx.estStandardTier.createMany({ data: tierRows })

        const cellRows = p.tiers.flatMap((t, idx) =>
          t.cells
            .filter(c => c.value !== null)
            .map(c => ({
              tier_id: tierRows[idx].id,
              item_id: itemId.get(itemKey(t.sheet, c.item))!,
              value: c.value,
              is_lump: c.is_lump,
            }))
        )
        for (let i = 0; i < cellRows.length; i += 2000) {
          await tx.estStandardCell.createMany({ data: cellRows.slice(i, i + 2000) })
        }
        return std.id
      },
      { maxWait: 10000, timeout: 120000 }
    )

    const counts = { values: vCount, tiers: p.tiers.length, cells: cCount }
    await createAuditLog({
      userId,
      service: "estimate",
      action: existing ? "UPDATE" : "CREATE",
      targetModel: "EstStandard",
      targetId: stdId,
      targetLabel: p.name,
      diff: existing ? { before: { note: "取り込み前の内容は入れ替え" }, after: counts } : counts,
    })
    results.push({ name: p.name, status: existing ? "replaced" : "created", ...counts })
  }
  return results
}