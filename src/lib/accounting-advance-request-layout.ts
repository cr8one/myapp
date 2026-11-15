// 仮払金請求受領書の紙様式のレイアウト定義。
// A4縦の上半分が請求書、下半分が受領書（どちらもA5横）。中央に切り取り線を入れる。
// 座標は、すべてmm。下半分は、HALF_H_MM だけ下にずらして描く。
// PDFは、必ずこの定義を読む（罫線と文字の位置をそろえるため）。

import type { Box, Seg } from "@/lib/accounting-trip-layout"

export const PAGE_W_MM = 210
export const PAGE_H_MM = 297
export const HALF_H_MM = 148.5 // 1枚（請求書・受領書）の高さ
export const LINE_WIDTH_MM = 0.35

const H = (y: number, x1: number, x2: number): Seg => ({ x1, y1: y, x2, y2: y })
const V = (x: number, y1: number, y2: number): Seg => ({ x1: x, y1, x2: x, y2 })
const shift = (s: Seg, oy: number): Seg => ({ ...s, y1: s.y1 + oy, y2: s.y2 + oy })
const box = (x0: number, y0: number, x1: number, y1: number, oy: number): Box => ({ x: x0, y: y0 + oy, w: x1 - x0, h: y1 - y0 })

// 枠の外周と、左側の行の罫線（請求書・受領書で共通）
const FRAME: Seg[] = [H(8, 10, 200), H(140, 10, 200), V(10, 8, 140), V(200, 8, 140)]
const LEFT_ROWS: Seg[] = [H(26, 10, 110), H(40, 10, 110), H(54, 10, 110), H(72, 10, 110), H(84, 10, 110), H(98, 10, 110)]

// ---- 切り取り線（中央。真ん中に「切り取り線」の文字を置くため、線を左右に分ける） ----
export const CUT_LINES: Seg[] = [H(HALF_H_MM, 5, 88), H(HALF_H_MM, 122, 205)]
export const CUT_LABEL: Box = { x: 88, y: HALF_H_MM - 2.5, w: 34, h: 5 }

// ---- 請求書（上半分） ----
function requestSheet(oy: number) {
  const k = (x0: number, y0: number, x1: number, y1: number) => box(x0, y0, x1, y1, oy)
  const lines: Seg[] = [
    ...FRAME,
    ...LEFT_ROWS,
    H(112, 10, 200), V(110, 8, 112), H(16, 110, 200),
    ...[28, 40, 52, 64, 76, 88, 100].map(y => H(y, 110, 200)), // 使途内容の罫線（8行）
    V(80, 112, 140), V(120, 112, 140), H(120, 80, 200),
  ].map(s => shift(s, oy))
  return {
    lines,
    title: k(10, 8, 110, 26),
    dateLabel: k(10, 26, 45, 40), dateValue: k(45, 26, 110, 40),
    deptLabel: k(10, 40, 45, 54), deptValue: k(45, 40, 110, 54),
    nameLabel: k(10, 54, 45, 72), nameValue: k(45, 54, 92, 72), seal: k(92, 54, 110, 72),
    text: k(10, 72, 110, 84),
    dueLabel: k(10, 84, 45, 98), dueValue: k(45, 84, 110, 98),
    amountLabel: k(10, 98, 45, 112), amountValue: k(45, 98, 110, 112),
    purposeHead: k(110, 8, 200, 16),
    purposeRows: Array.from({ length: 8 }, (_, i) => k(112, 16 + 12 * i, 198, 28 + 12 * i)),
    slipNo: k(10, 112, 80, 140),
  }
}

// ---- 受領書（下半分） ----
function receiptSheet(oy: number) {
  const k = (x0: number, y0: number, x1: number, y1: number) => box(x0, y0, x1, y1, oy)
  const lines: Seg[] = [
    ...FRAME,
    ...LEFT_ROWS,
    H(112, 10, 200), V(110, 8, 112), H(16, 110, 200),
    H(40, 110, 200), H(64, 110, 200), H(88, 110, 200), V(140, 88, 112),
  ].map(s => shift(s, oy))
  return {
    lines,
    title: k(10, 8, 110, 26),
    dateLabel: k(10, 26, 45, 40), dateValue: k(45, 26, 110, 40), // 受領日
    deptLabel: k(10, 40, 45, 54), deptValue: k(45, 40, 110, 54),
    nameLabel: k(10, 54, 45, 72), nameValue: k(45, 54, 92, 72), seal: k(92, 54, 110, 72), // 受領印
    text: k(10, 72, 110, 84),
    amountLabel: k(10, 84, 45, 98), amountValue: k(45, 84, 110, 98),
    dueLabel: k(10, 98, 45, 112), dueValue: k(45, 98, 110, 112),
    payHead: k(110, 8, 200, 16), // 「支払の記録（経理が記入）」
    paidDateLabel: k(110, 16, 140, 40), paidDateValue: k(140, 16, 200, 40),
    paidMethodLabel: k(110, 40, 140, 64), paidMethodValue: k(140, 40, 200, 64),
    paidAmountLabel: k(110, 64, 140, 88), paidAmountValue: k(140, 64, 200, 88),
    paidStamp: k(110, 88, 140, 112), // 支払済印
    slipNo: k(10, 112, 200, 140),
  }
}

export const REQUEST = requestSheet(0)
export const RECEIPT = receiptSheet(HALF_H_MM)

// ---- 承認欄（請求書の下の帯）。紙は、経理課2枠・当該部4枠。承認者が多いときは、人数に合わせて枠を狭める ----
export const APPROVAL_Y0 = 120
export const APPROVAL_H = 20
export const APPROVAL_HEADER_H = 5.2 // 役職名を載せる上の帯の高さ（mm）
export const APPROVAL_SLOT_W = 20 // 1枠の幅（mm）
export const APPROVAL_TITLE_ACCOUNTING: Box = { x: 80, y: 112, w: 40, h: 8 }
export const APPROVAL_TITLE_REQUESTER: Box = { x: 120, y: 112, w: 80, h: 8 }
export const APPROVAL_GROUP_ACCOUNTING = { left: 80, right: 120, slots: 2 }
export const APPROVAL_GROUP_REQUESTER = { left: 120, right: 200, slots: 4 }

// 文字サイズ（pt）
export const FONT = { title: 16, body: 11, label: 10, small: 7.5, approvalHead: 7, approvalName: 9 }

// 入力の上限（枠に収まる文字数）
export const LIMIT = { purpose: 150 }