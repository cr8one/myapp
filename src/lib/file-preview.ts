// ファイル名（拡張子）から、ブラウザで直接プレビュー可能かどうかを判定する共通関数。
// プレビュー可能：別タブで開いて表示しつつダウンロードもできる
// プレビュー不可：ダウンロードのみ（zip/msg/xlsx/ai/dxf等）
const PREVIEWABLE_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
])

export function isPreviewableFile(fileName: string): boolean {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return PREVIEWABLE_EXTENSIONS.has(ext)
}
