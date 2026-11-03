import { REG_MAX_BYTES, isPdfName } from "@/lib/eapp-regulations-shared"

export type RegulationVersion = { id: string; version_label: string | null; file_name: string; uploader_name: string | null; uploaded_at: string }
export type RegulationItem = {
  id: string
  title: string
  description: string | null
  sort_order: number
  latest: RegulationVersion | null
  history: RegulationVersion[] // 管理できる人にだけ、過去の版が入る
}

export async function fetchRegulations(): Promise<{ regulations: RegulationItem[]; can_manage: boolean }> {
  const res = await fetch("/api/eapp/regulations")
  if (!res.ok) throw new Error("規定等を取得できませんでした")
  return res.json()
}

// ファイルを選んだときの事前チェック（サーバーでも同じ検査をする）
export function checkPdfFile(file: File): string | null {
  if (!isPdfName(file.name)) return "PDFファイルを選択してください"
  if (file.size <= 0) return "空のファイルです"
  if (file.size > REG_MAX_BYTES) return `ファイルが大きすぎます（${REG_MAX_BYTES / 1024 / 1024}MBまで）`
  return null
}

// PDFをS3にアップロードする（準備→送信）。登録は、呼び出し側が、返ったキーで行う
export async function uploadRegulationPdf(file: File): Promise<string> {
  const pre = await fetch("/api/eapp/regulations/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_name: file.name, size: file.size }),
  })
  const preData = await pre.json().catch(() => ({}))
  if (!pre.ok) throw new Error(preData.error || "アップロードの準備に失敗しました")
  const put = await fetch(preData.url, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file })
  if (!put.ok) throw new Error("アップロードに失敗しました")
  return preData.key as string
}

// 規定のPDFを新しいタブで開く。versionIdを渡せるのは、管理できる人だけ（過去の版）。失敗したときは、メッセージを返す
export async function openRegulation(id: string, versionId?: string): Promise<string | null> {
  const popup = window.open("about:blank", "_blank") // ブラウザに止められないよう、クリックの直後に開いておく
  const query = versionId ? `?version_id=${encodeURIComponent(versionId)}` : ""
  const res = await fetch(`/api/eapp/regulations/${id}/url${query}`)
  if (!res.ok) {
    popup?.close()
    return "PDFを開けませんでした"
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
