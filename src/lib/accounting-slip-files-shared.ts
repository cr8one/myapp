// 経理精算の添付ファイルの規則（画面とサーバーの両方で使う。サーバー専用の部品は含めない）
export const ACCT_FILE_MAX_BYTES = 10 * 1024 * 1024
export const ACCT_FILE_MAX_COUNT = 10
export const ACCT_FILE_ACCEPT = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
export const ACCT_FILE_HELP = "PDF・画像（jpg・png・gif・webp・heic）、1つ10MBまで、10個まで"

const TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  heic: "image/heic", heif: "image/heif",
}

// ファイル名の拡張子から、許可する種類を決める。許可しない拡張子のときは null
export function contentTypeFromName(name: string): string | null {
  if (!name.includes(".")) return null
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  return TYPE_BY_EXT[ext] ?? null
}
