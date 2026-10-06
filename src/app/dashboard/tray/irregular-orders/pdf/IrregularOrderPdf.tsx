import { Document, Page, View, Text, Image, Svg, Line } from "@react-pdf/renderer"

// 押印欄の1列分。表示順は「左から右」で渡す（最後が申請者）
export type StampCol = { label: string; inkan_image_url?: string; name?: string }
export type PdfItem = { year: string; month: string; tray_name: string; qty: string }
export type IrregularOrderPdfProps = {
  order_no: string
  status: string
  request_date: string
  title: string
  items: PdfItem[]
  stamps: StampCol[]
}

const FONT = "NotoSansJP"
const LEFT = 24.7
const RIGHT = 282.2
const GRAY = "#E6E6E6"
const PT_MM = 0.3528 // 1pt = 0.3528mm
const mm = (v: number) => `${v}mm`

// react-pdfは日本語の自動改行で行末にハイフンを入れるため、文字幅から手動で改行位置を決める
function breakJa(text: string, maxMm: number, sizePt: number): string {
  const maxPt = maxMm / PT_MM
  const out: string[] = []
  let cur = ""
  let w = 0
  for (const ch of text) {
    if (ch === "\n") { out.push(cur); cur = ""; w = 0; continue }
    const half = ch.charCodeAt(0) < 0x80 || (ch >= "\uFF61" && ch <= "\uFF9F")
    const cw = half ? sizePt * 0.5 : sizePt
    if (w + cw > maxPt && cur !== "") { out.push(cur); cur = ""; w = 0 }
    cur += ch
    w += cw
  }
  out.push(cur)
  return out.join("\n")
}

// 枠（幅・高さmm）に収まるよう、文字サイズを小さくしながら手動改行する。欠けるより小さくても全部見えるほうを優先する
function fitText(text: string, widthMm: number, heightMm: number, maxSize: number): { text: string; size: number } {
  let size = maxSize
  for (;;) {
    const t = breakJa(text, widthMm, size)
    const lines = t.split("\n").length
    if (lines * size * 1.25 * PT_MM <= heightMm * 0.92 || size <= 5) return { text: t, size }
    size = Math.max(5, size - 0.5)
  }
}

// 罫線は塗りの細長い長方形ではなくストローク（線）で描く。細い線が表示環境で消えるのを防ぐため
function HLine({ x0, x1, y, w = 0.25 }: { x0: number; x1: number; y: number; w?: number }) {
  const len = x1 - x0
  return (
    <Svg viewBox={`0 0 ${len} 1`} style={{ position: "absolute", left: mm(x0), top: mm(y - 0.5), width: mm(len), height: mm(1) }}>
      <Line x1={0} y1={0.5} x2={len} y2={0.5} stroke="#000" strokeWidth={w * PT_MM} />
    </Svg>
  )
}
function VLine({ x, y0, y1, w = 0.25 }: { x: number; y0: number; y1: number; w?: number }) {
  const len = y1 - y0
  return (
    <Svg viewBox={`0 0 1 ${len}`} style={{ position: "absolute", left: mm(x - 0.5), top: mm(y0), width: mm(1), height: mm(len) }}>
      <Line x1={0.5} y1={0} x2={0.5} y2={len} stroke="#000" strokeWidth={w * PT_MM} />
    </Svg>
  )
}
function Box({ x, y, w, h, bg, align = "center", padRight = 0, children }: {
  x: number; y: number; w: number; h: number; bg?: string; align?: "center" | "right"; padRight?: number; children?: React.ReactNode
}) {
  return (
    <View style={{
      position: "absolute", left: mm(x), top: mm(y), width: mm(w), height: mm(h),
      backgroundColor: bg, justifyContent: "center", alignItems: align === "right" ? "flex-end" : "center",
      paddingRight: mm(padRight), overflow: "hidden",
    }}>{children}</View>
  )
}
function T({ size, children }: { size: number; children: React.ReactNode }) {
  return <Text style={{ fontFamily: FONT, fontSize: size, lineHeight: 1.25, color: "#000", textAlign: "center" }}>{children}</Text>
}

export default function IrregularOrderPdf(p: IrregularOrderPdfProps) {
  // 情報表（管理No.／ステータス／依頼日／タイトル）
  const infoY = [31.8, 40.6, 49.4, 58.3, 67.0]
  const infoRows: [string, string][] = [
    ["管理No.", p.order_no],
    ["ステータス", p.status],
    ["依頼日", p.request_date],
    ["タイトル（アーティスト、備考など）", p.title],
  ]
  const INFO_MID = 105.8

  // 明細表：最低5行。行数が増えたら1枚に収まるよう行の高さを詰める
  const colX = [24.7, 70.6, 91.7, 105.8, 225.8, 282.2]
  const ROWS_TOP = 93.9
  const rowCount = Math.max(5, p.items.length)
  const rowH = Math.min(14.02, 76.1 / rowCount)
  const rowsBottom = ROWS_TOP + rowH * rowCount
  const fs = Math.min(12, (rowH / PT_MM) * 0.6)
  const trayFit = (name: string) => fitText(name, 120 - 6, rowH, fs)

  // 押印欄：右詰め。1列の幅は21.15mm
  const n = p.stamps.length
  const stampW = Math.min(21.15, (RIGHT - LEFT) / Math.max(n, 1))
  const sx0 = RIGHT - stampW * n
  const sxs = Array.from({ length: n + 1 }, (_, i) => sx0 + stampW * i)
  const S_TOP = 174.0
  const S_MID = 182.4
  const S_BOTTOM = 200.0

  const titleFit = fitText(p.title, 176.4 - 6, 8.7, 11)

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={{ backgroundColor: "#FFFFFF" }}>
        {/* 見出し */}
        <View style={{ position: "absolute", left: mm(25.0), top: mm(6.2) }}>
          <Text style={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.25 }}>イレギュラートレイ発注書</Text>
        </View>
        <HLine x0={24.7} x1={109.4} y={15.0} w={1.0} />
        <View style={{ position: "absolute", left: mm(28.6), top: mm(19.8) }}>
          <Text style={{ fontFamily: FONT, fontSize: 12, lineHeight: 1.25 }}>下記のトレイの発注をお願いいたします。</Text>
        </View>

        {/* 情報表 */}
        {infoRows.map(([label, value], i) => (
          <View key={label}>
            <Box x={24.8} y={infoY[i]} w={INFO_MID - 24.8} h={infoY[i + 1] - infoY[i]} bg={GRAY}><T size={9}>{label}</T></Box>
            <Box x={INFO_MID} y={infoY[i]} w={RIGHT - INFO_MID} h={infoY[i + 1] - infoY[i]}>
              <T size={i === 3 ? titleFit.size : 11}>{i === 3 ? titleFit.text : value}</T>
            </Box>
          </View>
        ))}
        {infoY.map(y => <HLine key={y} x0={LEFT} x1={RIGHT} y={y} />)}
        {[LEFT, INFO_MID, RIGHT].map(x => <VLine key={x} x={x} y0={infoY[0]} y1={infoY[4]} />)}

        {/* 明細表の見出し */}
        <Box x={24.8} y={84.8} w={257.3} h={8.7} bg={GRAY}><View /></Box>
        <Box x={LEFT} y={84.8} w={106} h={8.7}><T size={9}>使用年月</T></Box>
        <Box x={105.8} y={84.8} w={120} h={8.7}><T size={9}>トレイ名</T></Box>
        <Box x={225.8} y={84.8} w={56.4} h={8.7}><T size={9}>数量</T></Box>
        <HLine x0={LEFT} x1={RIGHT} y={84.7} />
        <VLine x={LEFT} y0={84.7} y1={ROWS_TOP} />
        <VLine x={RIGHT} y0={84.7} y1={ROWS_TOP} />

        {/* 明細行 */}
        {Array.from({ length: rowCount }, (_, i) => {
          const it = p.items[i]
          const y = ROWS_TOP + rowH * i
          return (
            <View key={i}>
              {it && (
                <>
                  <Box x={colX[0]} y={y} w={colX[1] - colX[0]} h={rowH} align="right" padRight={5.9}><T size={fs}>{it.year}</T></Box>
                  <Box x={colX[1]} y={y} w={colX[2] - colX[1]} h={rowH}><T size={fs}>{it.month}</T></Box>
                  <Box x={colX[2]} y={y} w={colX[3] - colX[2]} h={rowH}><T size={fs * 0.83}>月</T></Box>
                  <Box x={colX[3]} y={y} w={colX[4] - colX[3]} h={rowH}><T size={trayFit(it.tray_name).size}>{trayFit(it.tray_name).text}</T></Box>
                  <Box x={colX[4]} y={y} w={colX[5] - colX[4]} h={rowH}><T size={fs}>{it.qty}</T></Box>
                </>
              )}
              <HLine x0={LEFT} x1={RIGHT} y={y} />
            </View>
          )
        })}
        <HLine x0={LEFT} x1={RIGHT} y={rowsBottom} />
        {colX.map(x => <VLine key={x} x={x} y0={ROWS_TOP} y1={rowsBottom} />)}

        {/* 押印欄（右端が申請者、左へ承認者の順） */}
        {p.stamps.map((s, i) => (
          <View key={i}>
            <Box x={sxs[i]} y={S_TOP} w={stampW} h={S_MID - S_TOP}><T size={8}>{s.label}</T></Box>
            <Box x={sxs[i]} y={S_MID} w={stampW} h={S_BOTTOM - S_MID}>
              {s.inkan_image_url
                ? <Image src={s.inkan_image_url} style={{ width: mm(10), height: mm(10), objectFit: "contain" }} />
                : s.name ? <T size={9}>{s.name}</T> : <View />}
            </Box>
          </View>
        ))}
        {[S_TOP, S_MID, S_BOTTOM].map(y => <HLine key={y} x0={sx0} x1={RIGHT} y={y} />)}
        {sxs.map(x => <VLine key={x} x={x} y0={S_TOP} y1={S_BOTTOM} />)}
      </Page>
    </Document>
  )
}
