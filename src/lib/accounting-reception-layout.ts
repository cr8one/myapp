// 御得意先接待承認書の紙様式のレイアウト定義（A5縦）。
// 見本（200dpiのスキャン、1160×1643px）の罫線を実測した値（px）を、実寸のmmに変換して持つ。
// PDFは、必ずこの定義を読む（罫線と文字の位置をそろえるため）。

import type { Box, Seg } from "@/lib/accounting-trip-layout"

export const PAGE_W_MM = 148
export const PAGE_H_MM = 210

const SCALE = 25.4 / 200 // 1pxあたりのmm（200dpi）
const L = 99 // 主表の左端（px）
const R = 1078 // 主表の右端（px）
const LEFT_MM = (PAGE_W_MM - (R - L) * SCALE) / 2 // 左右の余白を等しくする

export const mx = (px: number) => LEFT_MM + (px - L) * SCALE
export const my = (py: number) => py * SCALE
export const mw = (px: number) => px * SCALE

const box = (x0: number, y0: number, x1: number, y1: number): Box => ({ x: mx(x0), y: my(y0), w: mw(x1 - x0), h: mw(y1 - y0) })
export const LINE_WIDTH_MM = 0.35

// ---- 罫線 ----
const LINES_LIST: Seg[] = []
const H = (y: number, x1: number, x2: number) => LINES_LIST.push({ x1: mx(x1), y1: my(y), x2: mx(x2), y2: my(y) })
const V = (x: number, y1: number, y2: number) => LINES_LIST.push({ x1: mx(x), y1: my(y1), x2: mx(x), y2: my(y2) })

// タイトルの下線
H(186, 397, 781)
// 承認欄の外枠と、承認印・社長の仕切り（当該部の枠の仕切りは、承認者の人数に合わせて描くので、ここには入れない）
H(266, 176, 986); H(299, 235, 986); H(432, 176, 986)
V(176, 266, 432); V(235, 266, 432); V(354, 266, 432); V(986, 266, 432)
// 主表
H(513, L, R); H(600, L, R); H(776, L, R); H(864, L, R); H(1125, L, R); H(1212, L, R)
V(L, 513, 1212); V(296, 513, 1212); V(R, 513, 1212)
// 実際額（別の枠）
H(1232, L, R); H(1319, L, R)
V(L, 1232, 1319); V(296, 1232, 1319); V(R, 1232, 1319)

export const LINES: Seg[] = LINES_LIST

// ---- 上の部分 ----
export const SLIP_NO = box(700, 60, 1078, 110)
export const TITLE = box(L, 120, R, 184)
export const SUBTITLE = box(L, 196, R, 250)
export const SUBMIT_DATE = box(176, 440, 760, 505)

// ---- 承認欄（社長1枠・当該部の枠。紙は当該部5枠。承認者が多いときは、人数に合わせて枠を狭める） ----
export const APPROVAL_LABEL = box(176, 266, 235, 432) // 「承認印」の縦書き
export const APPROVAL_Y0 = my(299)
export const APPROVAL_H = my(432) - my(299)
export const APPROVAL_SLOT_W = mw(126) // 1枠の幅（mm）
export const APPROVAL_TITLE_PRESIDENT = box(235, 266, 354, 299)
export const APPROVAL_TITLE_DEPARTMENT = box(354, 266, 986, 299)
export const APPROVAL_GROUP_PRESIDENT = { left: mx(235), right: mx(354), slots: 1 }
export const APPROVAL_GROUP_DEPARTMENT = { left: mx(354), right: mx(986), slots: 5 }

// ---- 主表 ----
export const APPLICANT_LABEL = box(L, 513, 296, 600)
export const APPLICANT_VALUE = box(296, 513, 950, 600)
export const APPLICANT_SEAL = box(950, 513, R, 600)
export const CLIENT_LABEL = box(L, 600, 296, 688)
export const CLIENT_VALUE = box(296, 600, R, 688)
export const CONTACT_LABEL = box(L, 688, 296, 776)
export const CONTACT_VALUE = box(296, 688, R, 776)
export const DATE_LABEL = box(L, 776, 296, 864)
export const DATE_VALUE = box(296, 776, R, 864)
export const CONTENT_LABEL = box(L, 864, 296, 951)
export const CONTENT_VALUE = box(296, 864, R, 951)
export const PLACE_LABEL = box(L, 951, 296, 1038)
export const PLACE_VALUE = box(296, 951, R, 1038)
export const REASON_LABEL = box(L, 1038, 296, 1125)
export const REASON_VALUE = box(296, 1038, R, 1125)
export const BUDGET_LABEL = box(L, 1125, 296, 1212)
export const BUDGET_VALUE = box(296, 1125, 800, 1212)
export const ADVANCE_FLAG = box(800, 1125, R, 1212)
export const ACTUAL_LABEL = box(L, 1232, 296, 1319)
export const ACTUAL_VALUE = box(296, 1232, R, 1319)

// ---- 注意書き（紙に印字されているもの） ----
export const NOTES = [
  "1．必ず事前に承認をとり、本表を一旦申請者が保管する。",
  "2．事後、領収書又は請求書に本表を添付し、出金伝票と共に",
  "　　精算すること。",
  "3．領収書(10,000.以上)の宛先には当社社名を記入してもらうこと。",
  "　　『上様』は不可。",
]
export const NOTE_ROWS = NOTES.map((_, i) => box(L, 1360 + 48 * i, R, 1408 + 48 * i))

// 文字サイズ（pt）
export const FONT = { title: 18, subtitle: 11, body: 11, label: 12, small: 7.5, note: 9.5, approvalName: 8 }

// 入力の上限（枠に収まる文字数）
export const LIMIT = { client: 30, contact: 20, content: 60, place: 60, reason: 60 }
