"use client"
import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type AutocompleteInputProps = {
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
  placeholder?: string
  className?: string
}

export function AutocompleteInput({
  value, onChange, options, placeholder, className,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  // 絞り込み専用の検索語。入力欄の値（value）とは別に持つことで、
  // 「フォーカスした瞬間は常に全件表示、そこから打った分だけ絞り込む」を実現する。
  const [query, setQuery] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setQuery(e.target.value) }}
        onFocus={() => { setQuery(""); setOpen(true) }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 pr-7 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      />
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white border rounded-md shadow-lg">
          {filtered.map(o => (
            <button
              key={o.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(o.label); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-blue-50 text-gray-700"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
