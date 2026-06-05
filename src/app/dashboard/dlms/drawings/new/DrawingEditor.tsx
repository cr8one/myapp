"use client"
import { useEffect, useRef, useState, useCallback } from "react"

type LineType = "kirehba" | "suji" | "mishi"
type ToolType = "select" | "line" | "rect" | "circle" | "text" | "dimension"

const LINE_TYPES: { key: LineType; label: string; dash: string; desc: string }[] = [
  { key: "kirehba", label: "切れ刃", dash: "none", desc: "実線" },
  { key: "suji",    label: "スジ",   dash: "8,4",  desc: "長破線" },
  { key: "mishi",   label: "ミシン", dash: "2,3",  desc: "短破線" },
]
const COLORS = ["#1a1a1a", "#e24b4a", "#378add", "#639922", "#ba7517", "#888780"]
const TOOLS: { key: ToolType; label: string; svg: string }[] = [
  { key: "select",    label: "選択",    svg: '<path d="M4 2 L4 13 L7 10 L9 15 L11 14 L9 9 L13 9 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>' },
  { key: "line",      label: "直線",    svg: '<line x1="3" y1="14" x2="14" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
  { key: "rect",      label: "矩形",    svg: '<rect x="3" y="4" width="11" height="9" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
  { key: "circle",    label: "円",      svg: '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
  { key: "dimension", label: "寸法線",  svg: '<line x1="3" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="1.2"/><line x1="3" y1="6" x2="3" y2="12" stroke="currentColor" stroke-width="1.2"/><line x1="14" y1="6" x2="14" y2="12" stroke="currentColor" stroke-width="1.2"/>' },
  { key: "text",      label: "テキスト", svg: '<text x="4" y="13" font-size="11" font-weight="500" fill="currentColor">T</text>' },
]
const MAX_HISTORY = 50

export default function DrawingEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<ToolType>("select")
  const [lineType, setLineType] = useState<LineType>("kirehba")
  const [color, setColor] = useState("#1a1a1a")
  const [lineWidth, setLineWidth] = useState(1.5)
  const [zoom, setZoom] = useState(100)
  const [isDrawing, setIsDrawing] = useState(false)
  const [canUndo, setCanUndo] = useState(false)

  const startPos = useRef<{ x: number; y: number } | null>(null)
  const snapshotRef = useRef<ImageData | null>(null)
  const historyRef = useRef<ImageData[]>([])
  const historyIndexRef = useRef(-1)
  const fileRef = useRef<HTMLInputElement>(null)

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null

  // 初期化＆初期状態を履歴に保存
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 900
    canvas.height = 600
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const initial = ctx.getImageData(0, 0, canvas.width, canvas.height)
    historyRef.current = [initial]
    historyIndexRef.current = 0
    setCanUndo(false)
  }, [])

  const saveHistory = useCallback(() => {
    const ctx = getCtx()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    // 現在位置より後の履歴を破棄
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    // 上限を超えたら古いものを削除
    if (historyRef.current.length >= MAX_HISTORY) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }
    historyRef.current.push(snapshot)
    historyIndexRef.current = historyRef.current.length - 1
    setCanUndo(historyIndexRef.current > 0)
  }, [])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current--
    const ctx = getCtx()
    if (!ctx) return
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0)
    setCanUndo(historyIndexRef.current > 0)
  }, [])

  // Ctrl+Z / Cmd+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo])

  const getDash = (lt: LineType): number[] => {
    if (lt === "suji")  return [8, 4]
    if (lt === "mishi") return [2, 3]
    return []
  }

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "select") return
    const ctx = getCtx()
    if (!ctx) return
    const pos = getPos(e)
    startPos.current = pos
    snapshotRef.current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    setIsDrawing(true)
    if (tool === "text") {
      const text = prompt("テキストを入力:")
      if (!text) { setIsDrawing(false); return }
      ctx.font = `${14 * lineWidth}px sans-serif`
      ctx.fillStyle = color
      ctx.fillText(text, pos.x, pos.y)
      saveHistory()
      setIsDrawing(false)
    }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos.current || tool === "select" || tool === "text") return
    const ctx = getCtx()
    if (!ctx || !snapshotRef.current) return
    ctx.putImageData(snapshotRef.current, 0, 0)
    const pos = getPos(e)
    const { x: sx, y: sy } = startPos.current
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.setLineDash(getDash(lineType))
    ctx.lineCap = "round"
    ctx.beginPath()
    if (tool === "line") {
      ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke()
    } else if (tool === "rect") {
      ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy)
    } else if (tool === "circle") {
      const rx = Math.abs(pos.x - sx) / 2
      const ry = Math.abs(pos.y - sy) / 2
      const cx = (sx + pos.x) / 2
      const cy = (sy + pos.y) / 2
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (tool === "dimension") {
      ctx.setLineDash([])
      const y = sy
      ctx.moveTo(sx, y); ctx.lineTo(pos.x, y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(sx, y - 10); ctx.lineTo(sx, y + 10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(pos.x, y - 10); ctx.lineTo(pos.x, y + 10); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(sx + 6, y - 4); ctx.lineTo(sx, y); ctx.lineTo(sx + 6, y + 4); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(pos.x - 6, y - 4); ctx.lineTo(pos.x, y); ctx.lineTo(pos.x - 6, y + 4); ctx.stroke()
      const dist = Math.round(Math.abs(pos.x - sx))
      ctx.setLineDash([])
      ctx.font = "12px sans-serif"
      ctx.fillStyle = color
      ctx.textAlign = "center"
      ctx.fillText(`${dist}px`, (sx + pos.x) / 2, y - 14)
    }
    ctx.setLineDash([])
  }

  const onMouseUp = () => {
    if (isDrawing && tool !== "select" && tool !== "text") {
      saveHistory()
    }
    setIsDrawing(false)
    startPos.current = null
  }

  const handleImageLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const ctx = getCtx()
        if (!ctx || !canvasRef.current) return
        ctx.globalAlpha = 0.5
        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.globalAlpha = 1.0
        saveHistory()
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const exportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "drawing.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const clearCanvas = () => {
    const ctx = getCtx()
    if (!ctx || !canvasRef.current) return
    if (!confirm("キャンバスをクリアしますか？")) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    saveHistory()
  }

  const cursor = tool === "select" ? "default" : tool === "text" ? "text" : "crosshair"

  return (
    <div className="flex flex-col h-full" style={{ userSelect: "none" }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">図面作成</span>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageLoad} />
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
          >画像読み込み</button>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="元に戻す (⌘Z)"
          >元に戻す</button>
          <button
            onClick={exportPNG}
            className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
          >PNG書き出し</button>
          <button
            onClick={clearCanvas}
            className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 text-red-500"
          >クリア</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 左ツールバー */}
        <div className="flex flex-col items-center gap-1 px-1.5 py-3 border-r bg-white flex-shrink-0 w-12">
          {TOOLS.map(t => (
            <button
              key={t.key}
              title={t.label}
              onClick={() => setTool(t.key)}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${tool === t.key ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
            >
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" dangerouslySetInnerHTML={{ __html: t.svg }} />
            </button>
          ))}
          <div className="my-1 w-6 border-t border-gray-200" />
          {/* 元に戻す */}
          <button
            title="元に戻す (⌘Z)"
            onClick={undo}
            disabled={!canUndo}
            className="w-8 h-8 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 7 C3 4.5 5 2.5 7.5 2.5 C10 2.5 12 4.5 12 7 C12 9.5 10 11.5 7.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M3 4 L3 7 L6 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </button>
          {/* クリア */}
          <button
            title="クリア"
            onClick={clearCanvas}
            className="w-8 h-8 rounded flex items-center justify-center text-red-400 hover:bg-red-50"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* キャンバスエリア */}
        <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-start p-4">
          <canvas
            ref={canvasRef}
            style={{ cursor, boxShadow: "0 2px 12px rgba(0,0,0,0.12)", display: "block", width: `${zoom}%`, maxWidth: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>

        {/* 右パレット */}
        <div className="w-36 flex flex-col gap-3 px-2 py-3 border-l bg-white flex-shrink-0 overflow-y-auto">
          <div>
            <p className="text-xs text-gray-400 mb-1.5 px-1">線の種類</p>
            {LINE_TYPES.map(lt => (
              <button
                key={lt.key}
                onClick={() => setLineType(lt.key)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left mb-1 transition-colors ${lineType === lt.key ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <svg width="28" height="10" style={{ flexShrink: 0 }}>
                  <line x1="2" y1="5" x2="26" y2="5"
                    stroke={lineType === lt.key ? "#378add" : "#555"}
                    strokeWidth="1.5"
                    strokeDasharray={lt.dash === "none" ? undefined : lt.dash}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={`text-xs ${lineType === lt.key ? "text-blue-600 font-medium" : "text-gray-600"}`}>{lt.label}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100" />
          <div>
            <p className="text-xs text-gray-400 mb-1.5 px-1">線の色</p>
            <div className="flex flex-wrap gap-1.5 px-1">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ background: c, width: 20, height: 20, borderRadius: "50%", border: color === c ? "2px solid #378add" : "2px solid transparent" }}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <div>
            <p className="text-xs text-gray-400 mb-1.5 px-1">線の太さ: {lineWidth}px</p>
            <input type="range" min="0.5" max="6" step="0.5"
              value={lineWidth}
              onChange={e => setLineWidth(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="border-t border-gray-100" />
          <div>
            <p className="text-xs text-gray-400 mb-1.5 px-1">ズーム: {zoom}%</p>
            <input type="range" min="30" max="200" step="10"
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
