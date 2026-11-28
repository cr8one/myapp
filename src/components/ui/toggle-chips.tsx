"use client"

type ToggleChipOption = { id: string; label: string }

type ToggleChipsProps = {
  options: ToggleChipOption[]
  values: string[]
  onChange: (ids: string[]) => void
  emptyText?: string
}

// マスタの項目をボタンで並べ、押すたびにオン・オフを切り替える
export function ToggleChips({ options, values, onChange, emptyText = "項目がありません" }: ToggleChipsProps) {
  if (options.length === 0) return <p className="text-sm text-gray-500">{emptyText}</p>
  const toggle = (id: string) =>
    onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id])
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o.id)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              on
                ? "bg-blue-600 border-blue-600 text-white font-medium"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
