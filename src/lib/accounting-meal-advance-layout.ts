// 飲食費及び仮払精算書の紙様式のレイアウト定義。
// 見本（A5横・200dpiのスキャン、1646×1161px）の罫線を実測した値（px）を、実寸のmmに変換して持つ。
// PDFは、必ずこの定義を読む（罫線と文字の位置をそろえるため）。

import type { Box, Seg } from "@/lib/accounting-trip-layout"

export const PAGE_W_MM = 210
export const PAGE_H_MM = 148

const SCALE = 25.4 / 200 // 1pxあたりのmm（200dpi）
const L = 180 // 表の左端（px）
const R = 1606 // 表の右端（px）
const Y0 = 93 // 表の上端（px）
const LEFT_MM = (PAGE_W_MM - (R - L) * SCALE) / 2 // 左右の余白を等しくする
const TOP_MM = 10 // 上の余白（伝票番号を載せる）

export const mx = (px: number) => LEFT_MM + (px - L) * SCALE
export const my = (py: number) => TOP_MM + (py - Y0) * SCALE
export const mw = (px: number) => px * SCALE

// px座標の四角形から、mmの箱を作る
const box = (x0: number, y0: number, x1: number, y1: number): Box => ({
  x: mx(x0), y: my(y0), w: mw(x1 - x0), h: mw(y1 - y0),
})

export const LINE_WIDTH_MM = 0.35

// ---- 罫線 ----
const LINES_LIST: Seg[] = []
const H = (y: number, x1: number, x2: number) => LINES_LIST.push({ x1: mx(x1), y1: my(y), x2: mx(x2), y2: my(y) })
const V = (x: number, y1: number, y2: number) => LINES_LIST.push({ x1: mx(x), y1: my(y1), x2: mx(x), y2: my(y2) })

// 横線
H(93, L, R); H(125, 648, R); H(157, L, R); H(222, L, 648); H(275, L, R); H(311, L, 648); H(405, L, R)
H(437, L, R); H(487, 218, R); H(540, 218, 862); H(591, L, R)
H(623, L, R); H(673, 218, R); H(726, 218, 862); H(778, L, R)
H(808, L, R); H(860, L, R); H(912, L, R); H(963, L, R); H(1015, 862, R); H(1068, L, R); H(1121, L, R)
// 縦線（外枠と上の枠）
V(L, 93, 1121); V(R, 93, 1121); V(648, 93, 405); V(273, 157, 405); V(541, 275, 405)
V(1131, 93, 275)
// 縦線（飲食費A・B）
for (const [t0, t1, t2, t3, t4] of [[405, 437, 487, 540, 591], [591, 623, 673, 726, 778]]) {
  V(218, t1, t4); V(326, t1, t4); V(701, t1, t2); V(755, t0, t2); V(594, t3, t4); V(647, t3, t4)
  V(862, t0, t4); V(1183, t0, t2); V(1503, t0, t2)
}
// 縦線（その他精算・備考・合計）
V(218, 808, 963); V(862, 778, 1121); V(1183, 778, 1121); V(1503, 778, 963); V(1503, 1068, 1121); V(431, 1068, 1121); V(753, 1068, 1121)

export const LINES: Seg[] = LINES_LIST

// ---- 上の枠 ----
export const TITLE = box(L, 93, 648, 157)
export const SLIP_NO = { x: mx(1300), y: 2.5, w: mw(R - 1300), h: 6 }
export const DATE_LABEL = box(L, 157, 273, 222)
export const DATE_VALUE = box(273, 157, 648, 222)
export const DEPT_LABEL = box(L, 222, 273, 275)
export const DEPT_VALUE = box(273, 222, 648, 275)
export const CODE_LABEL = box(L, 275, 273, 311)
export const CODE_VALUE = box(273, 275, 541, 311)
export const NAME_LABEL = box(L, 311, 273, 405)
export const NAME_VALUE = box(273, 311, 541, 405)
export const SEAL_LABEL = box(541, 275, 648, 311)
export const SEAL_BOX = box(541, 311, 648, 405)
export const PURPOSE_LABEL = box(648, 275, 780, 311)
export const PURPOSE_VALUE = box(780, 280, 1600, 400)

// ---- 承認欄。紙は経理側（総務経理課）3枠・起案側（当該部）3枠だが、実際の承認ステップの数に合わせた可変の枠にする ----
// 枠は、最初の承認者がグループの右端に来て、右から左へ詰める。グループの範囲と、見出しの箱だけをここで決める
export const APPROVAL_Y0 = my(125)
export const APPROVAL_H = mw(275 - 125)
export const APPROVAL_HEADER_H = mw(157 - 125) // 役職名を載せる上の帯の高さ（mm）
export const APPROVAL_SLOT_W = mw(161) // 1枠の幅（mm）。人数が多いときは、グループの幅に収まるよう狭める
export const APPROVAL_TITLE_ACCOUNTING = box(648, 93, 1131, 125)
export const APPROVAL_TITLE_REQUESTER = box(1131, 93, R, 125)
export const APPROVAL_GROUP_ACCOUNTING = { left: mx(648), right: mx(1131) }
export const APPROVAL_GROUP_REQUESTER = { left: mx(1131), right: mx(R) }

// ---- 飲食費A・B（同じ作り。t0〜t4は、見出し・1行目・2行目・3行目・下端のy） ----
const mealBlock = ([t0, t1, t2, t3, t4]: number[]) => ({
  legend: box(L, t0, 755, t1), // 「種別 ①居酒屋 …」の印刷行
  headAmount: box(862, t0, 1183, t1),
  headAccount: box(1183, t0, 1503, t1),
  headCategory: box(1503, t0, R, t1),
  sideLabel: box(L, t1, 218, t4), // 「飲食費A」「飲食費B」
  payeeLabel: box(218, t1, 326, t2),
  payee: box(326, t1, 701, t2),
  kindLabel: box(701, t1, 755, t2),
  kind: box(755, t1, 862, t2),
  addressLabel: box(218, t2, 326, t3),
  address: box(326, t2, 862, t3),
  dateLabel: box(218, t3, 326, t4),
  date: box(326, t3, 594, t4),
  telLabel: box(594, t3, 647, t4),
  tel: box(647, t3, 862, t4),
  amount: box(862, t1, 1183, t2),
  account: box(1183, t1, 1503, t2),
  category: box(1503, t1, R, t2),
  headcountRow: box(862, t2, R, t3), // 「参加人数　　名」
  participantsRow: box(862, t3, R, t4), // 「参加者名」
})
export const MEAL_A = mealBlock([405, 437, 487, 540, 591])
export const MEAL_B = mealBlock([591, 623, 673, 726, 778])

// ---- その他精算（C・D・E） ----
export const OTHER_HEAD = box(L, 778, 862, 808)
export const OTHER_HEAD_AMOUNT = box(862, 778, 1183, 808)
export const OTHER_HEAD_ACCOUNT = box(1183, 778, 1503, 808)
export const OTHER_HEAD_CATEGORY = box(1503, 778, R, 808)
export const OTHER_ROWS = [[808, 860], [860, 912], [912, 963]].map(([y0, y1]) => ({
  letter: box(L, y0, 218, y1),
  item: box(218, y0, 862, y1),
  amount: box(862, y0, 1183, y1),
  account: box(1183, y0, 1503, y1),
  category: box(1503, y0, R, y1),
}))

// ---- 備考と合計 ----
export const REMARKS = box(L, 963, 862, 1068)
export const SUBTOTAL = box(862, 963, 1183, 1015)
export const SUBTOTAL_NOTE = box(1183, 963, R, 1015)
export const ADVANCE = box(862, 1015, 1183, 1068)
export const ADVANCE_NOTE = box(1183, 1015, R, 1068)
export const SHORTAGE = box(862, 1068, 1183, 1121)
export const BALANCE = box(1183, 1068, 1503, 1121)
export const BALANCE_NOTE = box(1503, 1068, R, 1121)
export const SHORT_ACCOUNT_LABEL = box(L, 1068, 431, 1121)
export const SHORT_ACCOUNT = box(431, 1068, 753, 1121)

// 見出しの語（欄の左に置く小さな文字）の幅（px）
export const SUM_LABEL_W = 60

// 文字サイズ（pt）
export const FONT = { title: 15, body: 11, small: 7.5, label: 10, approvalHead: 7, approvalName: 9, approvalDate: 6.5 }

// 入力の上限（枠に収まる文字数）
export const LIMIT = { purpose: 100, remarks: 70, payee: 20, address: 30, tel: 15, participants: 45, account: 20, otherItem: 30 }

// 種別の選択肢（様式の印刷どおり ①〜⑦）
export const MEAL_KINDS: readonly string[] = ["居酒屋", "ファミレス", "喫茶店", "寿司屋", "焼肉", "ちゃんこ", "その他"]
