"use client"
import { useEffect, useRef, useState } from "react"

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
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = value
    ? options.filter(o => o.label.toLowerCase().includes(value.toLowerCase()))
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
    <div ref={wrapperRef} className="relative flex-1">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className ?? "h-8 w-full border rounded px-2 text-sm"}
      />
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
