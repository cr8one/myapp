"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export type SelectOption = {
  id: string
  label: string
  sublabel?: string
}

// ============================================================
// 単一選択モーダル
// ============================================================
type SingleSelectModalProps = {
  label: string
  options: SelectOption[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  nullable?: boolean
}

export function SingleSelectModal({
  label, options, value, onChange, placeholder = "選択してください", nullable = true,
}: SingleSelectModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = options.find((o) => o.id === value)
  const filtered = options.filter((o) =>
    query === "" ||
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sublabel ?? "").toLowerCase().includes(query.toLowerCase())
  )
  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors text-left">
        {selected ? <span className="font-medium text-gray-800">{selected.label}</span>
          : <span className="text-gray-400">{placeholder}</span>}
        <span className="text-gray-400 ml-2 text-xs">▼</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
              <h2 className="font-semibold text-gray-800">{label}を選択</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="px-4 py-3 border-b">
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="検索..." className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="overflow-y-auto flex-1">
              {nullable && (
                <button type="button" onClick={() => { onChange(""); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b ${value === "" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-400 italic"}`}>
                  — 選択なし
                </button>
              )}
              {filtered.length === 0
                ? <p className="text-center text-sm text-gray-400 py-8">該当なし</p>
                : filtered.map((o) => (
                  <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false) }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${o.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"}`}>
                    <span className="flex flex-col">
                      <span>{o.label}</span>
                      {o.sublabel && <span className="text-xs text-gray-400">{o.sublabel}</span>}
                    </span>
                    {o.id === value && <span className="text-blue-500">✓</span>}
                  </button>
                ))
              }
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
              <span className="text-xs text-gray-400">{filtered.length}件表示</span>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================
// 複数選択モーダル
// ============================================================
type MultiSelectModalProps = {
  label: string
  options: SelectOption[]
  values: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
}

export function MultiSelectModal({
  label, options, values, onChange, placeholder = "選択してください（複数可）",
}: MultiSelectModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [draft, setDraft] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedOptions = options.filter((o) => values.includes(o.id))
  const filtered = options.filter((o) =>
    query === "" ||
    o.label.toLowerCase().includes(query.toLowerCase()) ||
    (o.sublabel ?? "").toLowerCase().includes(query.toLowerCase())
  )
  const toggleDraft = (id: string) =>
    setDraft((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const handleOpen = () => { setDraft([...values]); setQuery(""); setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }
  const handleConfirm = () => { onChange(draft); setOpen(false) }
  const handleCancel = () => { setDraft([]); setOpen(false) }
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleCancel() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])
  return (
    <>
      <button type="button" onClick={handleOpen}
        className="w-full flex items-start justify-between border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors text-left min-h-[38px]">
        {selectedOptions.length > 0
          ? <span className="flex flex-wrap gap-1.5 flex-1 pr-2">
              {selectedOptions.map((o) => (
                <span key={o.id} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{o.label}</span>
              ))}
            </span>
          : <span className="text-gray-400">{placeholder}</span>}
        <span className="text-gray-400 shrink-0 mt-0.5 text-xs">▼</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleCancel} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[75vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
              <h2 className="font-semibold text-gray-800">{label}を選択</h2>
              <div className="flex items-center gap-2">
                {draft.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-medium">{draft.length}件選択中</span>
                )}
                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
              </div>
            </div>
            <div className="px-4 py-3 border-b">
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="検索..." className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {draft.length > 0 && (
              <div className="px-4 py-2 border-b bg-blue-50 flex flex-wrap gap-1.5">
                {draft.map((id) => {
                  const o = options.find((x) => x.id === id)
                  if (!o) return null
                  return (
                    <span key={id} onClick={() => toggleDraft(id)}
                      className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium cursor-pointer hover:bg-blue-700 flex items-center gap-1">
                      {o.label} <span className="opacity-70">✕</span>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0
                ? <p className="text-center text-sm text-gray-400 py-8">該当なし</p>
                : filtered.map((o) => {
                  const checked = draft.includes(o.id)
                  return (
                    <button key={o.id} type="button" onClick={() => toggleDraft(o.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${checked ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-800"}`}>
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${checked ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                        {checked && (
                          <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-white">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className="flex flex-col">
                        <span className={checked ? "font-medium" : ""}>{o.label}</span>
                        {o.sublabel && <span className="text-xs text-gray-400">{o.sublabel}</span>}
                      </span>
                    </button>
                  )
                })
              }
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{filtered.length}件表示</span>
                {draft.length > 0 && (
                  <button type="button" onClick={() => setDraft([])} className="text-xs text-red-400 hover:text-red-600">すべて解除</button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>キャンセル</Button>
                <Button size="sm" onClick={handleConfirm}>確定 ({draft.length})</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
// ============================================================
// リモート検索選択モーダル（大量データ向け：APIキーワード検索）
// ============================================================
type RemoteSearchSelectModalProps = {
  label: string
  value: string
  onChange: (id: string, label: string) => void
  searchUrl: string
  placeholder?: string
  nullable?: boolean
}
export function RemoteSearchSelectModal({
  label, value, onChange, searchUrl, placeholder = "選択してください", nullable = true,
}: RemoteSearchSelectModalProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const timer = setTimeout(async () => {
      const res = await fetch(`${searchUrl}?keyword=${encodeURIComponent(query)}`)
      const data = await res.json()
      setOptions(data.options ?? [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, open, searchUrl])
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors text-left">
        {value ? <span className="font-medium text-gray-800">{value}</span>
          : <span className="text-gray-400">{placeholder}</span>}
        <span className="text-gray-400 ml-2 text-xs">▼</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
              <h2 className="font-semibold text-gray-800">{label}を選択</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="px-4 py-3 border-b">
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="No・品名・取引先などで検索..." className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="overflow-y-auto flex-1">
              {nullable && (
                <button type="button" onClick={() => { onChange("", ""); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 border-b ${value === "" ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-400 italic"}`}>
                  — 選択なし
                </button>
              )}
              {loading ? (
                <p className="text-center text-sm text-gray-400 py-8">検索中...</p>
              ) : options.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">該当なし</p>
              ) : options.map((o) => (
                <button key={o.id} type="button" onClick={() => { onChange(o.id, o.label); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between ${o.id === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"}`}>
                  <span className="flex flex-col">
                    <span>{o.label}</span>
                    {o.sublabel && <span className="text-xs text-gray-400">{o.sublabel}</span>}
                  </span>
                  {o.id === value && <span className="text-blue-500">✓</span>}
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl flex justify-end items-center">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
