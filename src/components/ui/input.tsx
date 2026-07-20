import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

function normalizeDateString(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return ""
  let m = trimmed.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  m = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo}-${d}`
  }
  return null
}

function DateInput({ className, value, onChange, ...rest }: React.ComponentProps<"input">) {
  const dateRef = React.useRef<HTMLInputElement>(null)
  const initial = typeof value === "string" ? value : ""
  const [text, setText] = React.useState(initial)

  React.useEffect(() => { setText(initial) }, [initial])

  const commit = (raw: string) => {
    const normalized = normalizeDateString(raw)
    const finalValue = normalized ?? raw
    setText(finalValue)
    if (onChange) {
      const evt = { target: { value: finalValue } } as React.ChangeEvent<HTMLInputElement>
      onChange(evt)
    }
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="YYYY-MM-DD"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onPaste={e => {
          const pasted = e.clipboardData.getData("text")
          e.preventDefault()
          commit(pasted)
        }}
        data-slot="input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 pr-8 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          className
        )}
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      <input
        ref={dateRef}
        type="date"
        value={text}
        onChange={e => commit(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => { try { (dateRef.current as any)?.showPicker?.() } catch {} }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        <Calendar className="w-4 h-4" />
      </button>
    </div>
  )
}

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  if (type === "date") {
    return <DateInput className={className} {...props} />
  }

  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
