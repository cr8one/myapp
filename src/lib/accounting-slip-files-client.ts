import { ACCT_FILE_MAX_BYTES, contentTypeFromName } from "@/lib/accounting-slip-files-shared"

export type AttachedFile = { id: string; file_name: string; file_type: string }

// ファイルを選んだときの事前チェック（サーバーでも同じ検査をする）。問題があれば、メッセージを返す
export function checkClientFile(file: File): string | null {
  if (!contentTypeFromName(file.name)) return `「${file.name}」は添付できません（PDFと画像だけです）`
  if (file.size <= 0) return `「${file.name}」は空のファイルです`
  if (file.size > ACCT_FILE_MAX_BYTES) return `「${file.name}」が大きすぎます（${ACCT_FILE_MAX_BYTES / 1024 / 1024}MBまで）`
  return null
}

// アップロード：準備（署名つきURL）→ S3へ送信 → 伝票に登録
export async function uploadAccountingFile(slipId: string, file: File): Promise<AttachedFile> {
  const pre = await fetch(`/api/eapp/accounting/slips/${slipId}/files/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_name: file.name, size: file.size }),
  })
  const preData = await pre.json().catch(() => ({}))
  if (!pre.ok) throw new Error(preData.error || `「${file.name}」のアップロードの準備に失敗しました`)

  const put = await fetch(preData.url, { method: "PUT", headers: { "Content-Type": preData.content_type }, body: file })
  if (!put.ok) throw new Error(`「${file.name}」のアップロードに失敗しました`)

  const reg = await fetch(`/api/eapp/accounting/slips/${slipId}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: preData.key, file_name: file.name }),
  })
  const regData = await reg.json().catch(() => ({}))
  if (!reg.ok) throw new Error(regData.error || `「${file.name}」の登録に失敗しました`)
  return regData as AttachedFile
}

// 添付を新しいタブで開く。伝票を見てよい人にだけ、5分間だけ有効なURLが返る。失敗したときは、メッセージを返す
export async function openAccountingFile(slipId: string, fileId: string): Promise<string | null> {
  const popup = window.open("about:blank", "_blank") // ブラウザに止められないよう、クリックの直後に開いておく
  const res = await fetch(`/api/eapp/accounting/slips/${slipId}/files/${fileId}/url`)
  if (!res.ok) {
    popup?.close()
    return "ファイルを開けませんでした"
  }
  const { url } = await res.json()
  if (popup) {
    popup.opener = null
    popup.location.href = url
  } else {
    window.location.href = url
  }
  return null
}
