"use client"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ACCT_FILE_ACCEPT, ACCT_FILE_HELP, ACCT_FILE_MAX_COUNT } from "@/lib/accounting-slip-files-shared"
import { AttachedFile, checkClientFile, uploadAccountingFile, openAccountingFile } from "@/lib/accounting-slip-files-client"

// 添付ファイルの欄。
// queue：新規作成。伝票がまだないので、選んだファイルを、画面に置いておく（保存のときにアップロードする）
// live：編集。伝票があるので、選ぶとすぐアップロードし、削除もすぐ実行する
type Props =
  | { mode: "queue"; queued: File[]; onQueue: (files: File[]) => void }
  | { mode: "live"; slipId: string; attached: AttachedFile[]; onAttached: (list: AttachedFile[]) => void }

export default function AttachmentsEditor(props: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const count = props.mode === "queue" ? props.queued.length : props.attached.length

  const onSelect = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    setError("")
    const picked = Array.from(list)
    if (inputRef.current) inputRef.current.value = ""
    if (count + picked.length > ACCT_FILE_MAX_COUNT) { setError(`添付は${ACCT_FILE_MAX_COUNT}個までです`); return }
    for (const f of picked) {
      const m = checkClientFile(f)
      if (m) { setError(m); return }
    }
    if (props.mode === "queue") { props.onQueue([...props.queued, ...picked]); return }
    setBusy(true)
    let current = props.attached
    try {
      for (const f of picked) {
        const added = await uploadAccountingFile(props.slipId, f)
        current = [...current, added]
        props.onAttached(current)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const removeQueued = (i: number) => {
    if (props.mode === "queue") props.onQueue(props.queued.filter((_, j) => j !== i))
  }
  const removeAttached = async (fileId: string) => {
    if (props.mode !== "live") return
    if (!confirm("この添付を削除しますか？")) return
    setBusy(true)
    setError("")
    try {
      const res = await fetch(`/api/eapp/accounting/slips/${props.slipId}/files/${fileId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "削除に失敗しました")
      props.onAttached(props.attached.filter(f => f.id !== fileId))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const open = async (fileId: string) => {
    if (props.mode !== "live") return
    const err = await openAccountingFile(props.slipId, fileId)
    if (err) setError(err)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Button variant="outline" size="sm" disabled={busy || count >= ACCT_FILE_MAX_COUNT} onClick={() => inputRef.current?.click()}>
          ファイルを選ぶ
        </Button>
        <span className="text-xs text-gray-400">{ACCT_FILE_HELP}</span>
        <input ref={inputRef} type="file" multiple accept={ACCT_FILE_ACCEPT} className="hidden" onChange={e => onSelect(e.target.files)} />
      </div>
      {busy && <p className="text-xs text-gray-500 mb-2 animate-pulse">処理中...</p>}
      {error && <p className="text-sm px-3 py-2 rounded bg-red-50 text-red-600 mb-2">{error}</p>}
      {count === 0 ? (
        <p className="text-sm text-gray-400">添付はありません。</p>
      ) : (
        <div className="space-y-1">
          {props.mode === "queue"
            ? props.queued.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm border-b border-gray-100 py-2">
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">保存のときにアップロードします</span>
                  <button onClick={() => removeQueued(i)} className="text-xs text-red-500 hover:text-red-700">取り除く</button>
                </div>
              ))
            : props.attached.map(f => (
                <div key={f.id} className="flex items-center gap-3 text-sm border-b border-gray-100 py-2">
                  <span className="flex-1 truncate">{f.file_name}</span>
                  <button onClick={() => open(f.id)} className="text-xs text-blue-500 hover:text-blue-700">開く</button>
                  <button disabled={busy} onClick={() => removeAttached(f.id)} className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">削除</button>
                </div>
              ))}
        </div>
      )}
    </div>
  )
}
