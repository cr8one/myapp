"use client"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

type Result = { value: string; sublabel: string }

// 型台帳番号（抜き型管理の親uid_ntemp＋子edaban、例：1009651-02）検索付き入力欄。
// 抜き型データは件数が多くなりうるため、全件事前読み込みではなくAPI検索方式にしている。
export function DielineNoSearchInput({
  value, onChange, placeholder = "型台帳番号を入力または選択",
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = async (kw: string) => {
    setLoading(true)
    const res = await fetch(`/api/dlms/dielines/search?keyword=${encodeURIComponent(kw)}`)
    setResults(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    if (!open) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, open])

  const handleOpen = () => {
    setQuery("")
    setOpen(true)
    runSearch("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  return (
    <>
      <div className="flex gap-2">
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} autoComplete="off"
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <Button type="button" variant="outline" size="sm" onClick={handleOpen}>
          <Search className="w-4 h-4" />
        </Button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
              <h2 className="font-semibold text-gray-800">型台帳番号を選択</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <div className="px-4 py-3 border-b">
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="型番号・旧型番・品目名・枝番で検索..." className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <p className="text-center text-sm text-gray-400 py-8">検索中...</p>
              ) : results.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">該当なし</p>
              ) : results.map((r, i) => (
                <button key={`${r.value}-${i}`} type="button" onClick={() => { onChange(r.value); setOpen(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors text-gray-800">
                  <span className="flex flex-col">
                    <span>{r.value}</span>
                    {r.sublabel && <span className="text-xs text-gray-400">{r.sublabel}</span>}
                  </span>
                </button>
              ))}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
              <span className="text-xs text-gray-400">{results.length}件表示</span>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
