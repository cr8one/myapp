// 承認系のPDFに載せる印影の大きさ（全PDF共通）。
// ユーザーマスタの印影は、円が画像いっぱいの正方形（四隅は透明）で保存されている。そのため、画像の一辺＝円の直径になる。
// 一般的な認印の円の直径は9.5mm。枠の大きさに合わせて拡大すると幼稚に見えるため、枠に収まる限り、この大きさを保つ。
export const STAMP_DIAMETER_MM = 9.5

// 枠（幅・高さ）に収まるときは9.5mm。枠が小さいときだけ、収まる大きさに縮める
export const stampSizeMm = (boxW: number, boxH: number): number => Math.min(STAMP_DIAMETER_MM, boxW - 1, boxH - 1)
