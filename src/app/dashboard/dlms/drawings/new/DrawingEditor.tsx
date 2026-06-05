"use client"
import { useEffect, useRef, useState, useCallback } from "react"

type LineType = "kirehba" | "suji" | "mishi"
type ToolType = "select" | "line" | "rect" | "circle" | "text" | "dimension"

type DrawObject =
  | { id: string; type: "line"; x1: number; y1: number; x2: number; y2: number; color: string; lineWidth: number; lineType: LineType }
  | { id: string; type: "rect"; x: number; y: number; w: number; h: number; color: string; lineWidth: number; lineType: LineType }
  | { id: string; type: "circle"; cx: number; cy: number; rx: number; ry: number; color: string; lineWidth: number; lineType: LineType }
  | { id: string; type: "text"; x: number; y: number; text: string; color: string; lineWidth: number }
  | { id: string; type: "dimension"; x1: number; y1: number; x2: number; y2: number; color: string; lineWidth: number }
  | { id: string; type: "image"; dataUrl: string; x: number; y: number; w: number; h: number }

type Handle = {
  id: string
  x: number
  y: number
  cursor: string
}

const LINE_TYPES: { key: LineType; label: string; dash: string }[] = [
  { key: "kirehba", label: "切れ刃", dash: "none" },
  { key: "suji",    label: "スジ",   dash: "8,4" },
  { key: "mishi",   label: "ミシン", dash: "2,3" },
]
const COLORS = ["#1a1a1a", "#e24b4a", "#378add", "#639922", "#ba7517", "#888780"]
const TOOLS: { key: ToolType; label: string; svg: string }[] = [
  { key: "select",    label: "選択・移動", svg: '<path d="M4 2 L4 13 L7 10 L9 15 L11 14 L9 9 L13 9 Z" stroke="currentColor" stroke-width="1.2" fill="none"/>' },
  { key: "line",      label: "直線",       svg: '<line x1="3" y1="14" x2="14" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' },
  { key: "rect",      label: "矩形",       svg: '<rect x="3" y="4" width="11" height="9" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
  { key: "circle",    label: "円",         svg: '<circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>' },
  { key: "dimension", label: "寸法線",     svg: '<line x1="3" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="1.2"/><line x1="3" y1="6" x2="3" y2="12" stroke="currentColor" stroke-width="1.2"/><line x1="14" y1="6" x2="14" y2="12" stroke="currentColor" stroke-width="1.2"/>' },
  { key: "text",      label: "テキスト",   svg: '<text x="4" y="13" font-size="11" font-weight="500" fill="currentColor">T</text>' },
]
const MAX_HISTORY = 50
const CANVAS_W = 900
const CANVAS_H = 600
const HIT_MARGIN = 6
const HANDLE_SIZE = 7

function uid() { return Math.random().toString(36).slice(2) }

function getDash(lt: LineType): number[] {
  if (lt === "suji")  return [8, 4]
  if (lt === "mishi") return [2, 3]
  return []
}

// オブジェクトのリサイズハンドル一覧を返す
function getHandles(obj: DrawObject): Handle[] {
  switch (obj.type) {
    case "rect": {
      const { x, y, w, h } = obj
      return [
        { id: "nw", x, y, cursor: "nwse-resize" },
        { id: "n",  x: x + w / 2, y, cursor: "ns-resize" },
        { id: "ne", x: x + w, y, cursor: "nesw-resize" },
        { id: "e",  x: x + w, y: y + h / 2, cursor: "ew-resize" },
        { id: "se", x: x + w, y: y + h, cursor: "nwse-resize" },
        { id: "s",  x: x + w / 2, y: y + h, cursor: "ns-resize" },
        { id: "sw", x, y: y + h, cursor: "nesw-resize" },
        { id: "w",  x, y: y + h / 2, cursor: "ew-resize" },
      ]
    }
    case "circle": {
      const { cx, cy, rx, ry } = obj
      return [
        { id: "nw", x: cx - rx, y: cy - ry, cursor: "nwse-resize" },
        { id: "ne", x: cx + rx, y: cy - ry, cursor: "nesw-resize" },
        { id: "se", x: cx + rx, y: cy + ry, cursor: "nwse-resize" },
        { id: "sw", x: cx - rx, y: cy + ry, cursor: "nesw-resize" },
      ]
    }
    case "line":
    case "dimension": {
      return [
        { id: "p1", x: obj.x1, y: obj.y1, cursor: "crosshair" },
        { id: "p2", x: obj.x2, y: obj.y2, cursor: "crosshair" },
      ]
    }
    case "image": {
      const { x, y, w, h } = obj
      return [
        { id: "nw", x, y, cursor: "nwse-resize" },
        { id: "ne", x: x + w, y, cursor: "nesw-resize" },
        { id: "se", x: x + w, y: y + h, cursor: "nwse-resize" },
        { id: "sw", x, y: y + h, cursor: "nesw-resize" },
      ]
    }
    default:
      return []
  }
}

// ハンドルのヒットテスト
function hitHandle(handle: Handle, x: number, y: number): boolean {
  return Math.abs(x - handle.x) <= HANDLE_SIZE && Math.abs(y - handle.y) <= HANDLE_SIZE
}

// ハンドルドラッグでオブジェクトをリサイズ
function resizeObject(obj: DrawObject, handleId: string, dx: number, dy: number): DrawObject {
  switch (obj.type) {
    case "rect": {
      let { x, y, w, h } = obj
      if (handleId.includes("w")) { x += dx; w -= dx }
      if (handleId.includes("e")) { w += dx }
      if (handleId.includes("n")) { y += dy; h -= dy }
      if (handleId.includes("s")) { h += dy }
      return { ...obj, x, y, w, h }
    }
    case "circle": {
      let { cx, cy, rx, ry } = obj
      if (handleId === "nw") { rx -= dx / 2; ry -= dy / 2; cx += dx / 2; cy += dy / 2 }
      if (handleId === "ne") { rx += dx / 2; ry -= dy / 2; cx += dx / 2; cy += dy / 2 }
      if (handleId === "se") { rx += dx / 2; ry += dy / 2; cx += dx / 2; cy += dy / 2 }
      if (handleId === "sw") { rx -= dx / 2; ry += dy / 2; cx += dx / 2; cy += dy / 2 }
      return { ...obj, cx, cy, rx: Math.max(4, Math.abs(rx)), ry: Math.max(4, Math.abs(ry)) }
    }
    case "line":
    case "dimension": {
      if (handleId === "p1") return { ...obj, x1: obj.x1 + dx, y1: obj.y1 + dy }
      if (handleId === "p2") return { ...obj, x2: obj.x2 + dx, y2: obj.y2 + dy }
      return obj
    }
    case "image": {
      let { x, y, w, h } = obj
      if (handleId === "nw") { x += dx; w -= dx; y += dy; h -= dy }
      if (handleId === "ne") { w += dx; y += dy; h -= dy }
      if (handleId === "se") { w += dx; h += dy }
      if (handleId === "sw") { x += dx; w -= dx; h += dy }
      return { ...obj, x, y, w: Math.max(20, w), h: Math.max(20, h) }
    }
    default:
      return obj
  }
}

function hitTest(obj: DrawObject, x: number, y: number): boolean {
  switch (obj.type) {
    case "line":
    case "dimension": {
      const { x1, y1, x2, y2 } = obj
      const len = Math.hypot(x2 - x1, y2 - y1)
      if (len === 0) return false
      const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (len * len)
      const tc = Math.max(0, Math.min(1, t))
      const px = x1 + tc * (x2 - x1); const py = y1 + tc * (y2 - y1)
      return Math.hypot(x - px, y - py) <= HIT_MARGIN + obj.lineWidth
    }
    case "rect": {
      const { x: rx, y: ry, w, h } = obj
      const x2 = rx + w; const y2 = ry + h
      return (Math.abs(x - rx) <= HIT_MARGIN && y >= ry - HIT_MARGIN && y <= y2 + HIT_MARGIN) ||
             (Math.abs(x - x2) <= HIT_MARGIN && y >= ry - HIT_MARGIN && y <= y2 + HIT_MARGIN) ||
             (Math.abs(y - ry) <= HIT_MARGIN && x >= rx - HIT_MARGIN && x <= x2 + HIT_MARGIN) ||
             (Math.abs(y - y2) <= HIT_MARGIN && x >= rx - HIT_MARGIN && x <= x2 + HIT_MARGIN)
    }
    case "circle": {
      const dist = Math.hypot(x - obj.cx, y - obj.cy)
      const r = (obj.rx + obj.ry) / 2
      return Math.abs(dist - r) <= HIT_MARGIN + obj.lineWidth
    }
    case "text":
      return Math.abs(x - obj.x) <= 60 && Math.abs(y - obj.y) <= 20
    case "image":
      return x >= obj.x && x <= obj.x + obj.w && y >= obj.y && y <= obj.y + obj.h
  }
}

function moveObject(obj: DrawObject, dx: number, dy: number): DrawObject {
  switch (obj.type) {
    case "line": case "dimension": return { ...obj, x1: obj.x1 + dx, y1: obj.y1 + dy, x2: obj.x2 + dx, y2: obj.y2 + dy }
    case "rect":   return { ...obj, x: obj.x + dx, y: obj.y + dy }
    case "circle": return { ...obj, cx: obj.cx + dx, cy: obj.cy + dy }
    case "text":   return { ...obj, x: obj.x + dx, y: obj.y + dy }
    case "image":  return { ...obj, x: obj.x + dx, y: obj.y + dy }
  }
}

function renderObject(ctx: CanvasRenderingContext2D, obj: DrawObject, selected: boolean) {
  ctx.save()
  if (obj.type === "image") { ctx.restore(); return }
  ctx.strokeStyle = obj.color; ctx.fillStyle = obj.color
  ctx.lineWidth = obj.lineWidth; ctx.lineCap = "round"
  if (obj.type !== "text") ctx.setLineDash(getDash((obj as { lineType: LineType }).lineType))

  switch (obj.type) {
    case "line":
      ctx.beginPath(); ctx.moveTo(obj.x1, obj.y1); ctx.lineTo(obj.x2, obj.y2); ctx.stroke(); break
    case "rect":
      ctx.beginPath(); ctx.strokeRect(obj.x, obj.y, obj.w, obj.h); break
    case "circle":
      ctx.beginPath()
      ctx.ellipse(obj.cx, obj.cy, Math.abs(obj.rx), Math.abs(obj.ry), 0, 0, Math.PI * 2)
      ctx.stroke(); break
    case "text":
      ctx.font = `${14 * obj.lineWidth}px sans-serif`; ctx.fillText(obj.text, obj.x, obj.y); break
    case "dimension": {
      ctx.setLineDash([])
      const y = obj.y1
      ctx.beginPath(); ctx.moveTo(obj.x1, y); ctx.lineTo(obj.x2, y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(obj.x1, y - 10); ctx.lineTo(obj.x1, y + 10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(obj.x2, y - 10); ctx.lineTo(obj.x2, y + 10); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(obj.x1 + 6, y - 4); ctx.lineTo(obj.x1, y); ctx.lineTo(obj.x1 + 6, y + 4); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(obj.x2 - 6, y - 4); ctx.lineTo(obj.x2, y); ctx.lineTo(obj.x2 - 6, y + 4); ctx.stroke()
      ctx.setLineDash([]); ctx.font = "12px sans-serif"; ctx.textAlign = "center"
      ctx.fillText(`${Math.round(Math.abs(obj.x2 - obj.x1))}px`, (obj.x1 + obj.x2) / 2, y - 14); break
    }
  }

  if (selected) {
    ctx.setLineDash([4, 3]); ctx.strokeStyle = "#378add"; ctx.lineWidth = 1
    switch (obj.type) {
      case "line": case "dimension": {
        const minX = Math.min(obj.x1, obj.x2) - 6; const minY = Math.min(obj.y1, obj.y2) - 6
        ctx.strokeRect(minX, minY, Math.max(obj.x1, obj.x2) - minX + 6, Math.max(obj.y1, obj.y2) - minY + 6); break
      }
      case "rect":   ctx.strokeRect(obj.x - 4, obj.y - 4, obj.w + 8, obj.h + 8); break
      case "circle": ctx.strokeRect(obj.cx - Math.abs(obj.rx) - 4, obj.cy - Math.abs(obj.ry) - 4, Math.abs(obj.rx) * 2 + 8, Math.abs(obj.ry) * 2 + 8); break
      case "text":   ctx.strokeRect(obj.x - 4, obj.y - 18, 80, 24); break
    }

    // ハンドルを描画
    ctx.setLineDash([])
    getHandles(obj).forEach(h => {
      ctx.fillStyle = "#ffffff"
      ctx.strokeStyle = "#378add"
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.rect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
      ctx.fill(); ctx.stroke()
    })
  }
  ctx.restore()
}

export default function DrawingEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<ToolType>("select")
  const [lineType, setLineType] = useState<LineType>("kirehba")
  const [color, setColor] = useState("#1a1a1a")
  const [lineWidth, setLineWidth] = useState(1.5)
  const [zoom, setZoom] = useState(100)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [cursorStyle, setCursorStyle] = useState("default")

  const objectsRef = useRef<DrawObject[]>([])
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const historyRef = useRef<DrawObject[][]>([[]])
  const historyIndexRef = useRef(0)
  const isDrawingRef = useRef(false)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const previewObjRef = useRef<DrawObject | null>(null)
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const activeHandleRef = useRef<string | null>(null)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (const obj of objectsRef.current) {
      if (obj.type === "image") {
        const img = imagesRef.current.get(obj.id)
        if (img) {
          ctx.save(); ctx.globalAlpha = 0.5
          ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h)
          ctx.globalAlpha = 1; ctx.restore()
          // 選択中は画像もハンドル表示
          if (obj.id === selectedId) {
            ctx.save()
            ctx.setLineDash([4, 3]); ctx.strokeStyle = "#378add"; ctx.lineWidth = 1
            ctx.strokeRect(obj.x, obj.y, obj.w, obj.h)
            ctx.setLineDash([])
            getHandles(obj).forEach(h => {
              ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#378add"; ctx.lineWidth = 1.5
              ctx.beginPath(); ctx.rect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
              ctx.fill(); ctx.stroke()
            })
            ctx.restore()
          }
        }
      } else {
        renderObject(ctx, obj, obj.id === selectedId)
      }
    }
    if (previewObjRef.current) renderObject(ctx, previewObjRef.current, false)
  }, [selectedId])

  useEffect(() => { redraw() }, [redraw])

  const saveHistory = useCallback(() => {
    const snapshot = objectsRef.current.map(o => ({ ...o }))
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    if (historyRef.current.length >= MAX_HISTORY) historyRef.current.shift()
    else historyIndexRef.current++
    historyRef.current.push(snapshot)
    historyIndexRef.current = historyRef.current.length - 1
    setCanUndo(historyIndexRef.current > 0); setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current--
    objectsRef.current = historyRef.current[historyIndexRef.current].map(o => ({ ...o }))
    setSelectedId(null); setCanUndo(historyIndexRef.current > 0); setCanRedo(true); redraw()
  }, [redraw])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current++
    objectsRef.current = historyRef.current[historyIndexRef.current].map(o => ({ ...o }))
    setSelectedId(null); setCanUndo(true)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1); redraw()
  }, [redraw])

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    objectsRef.current = objectsRef.current.filter(o => o.id !== selectedId)
    setSelectedId(null); saveHistory(); redraw()
  }, [selectedId, saveHistory, redraw])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo() }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) { e.preventDefault(); deleteSelected() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, deleteSelected, selectedId])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (CANVAS_W / rect.width), y: (e.clientY - rect.top) * (CANVAS_H / rect.height) }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e)

    if (tool === "select") {
      // 選択中オブジェクトのハンドルを先にチェック
      if (selectedId) {
        const selObj = objectsRef.current.find(o => o.id === selectedId)
        if (selObj) {
          const handles = getHandles(selObj)
          const hit = handles.find(h => hitHandle(h, pos.x, pos.y))
          if (hit) {
            isResizingRef.current = true
            activeHandleRef.current = hit.id
            dragStartRef.current = pos
            return
          }
        }
      }
      // オブジェクト本体のヒットテスト
      let found: DrawObject | null = null
      for (let i = objectsRef.current.length - 1; i >= 0; i--) {
        if (hitTest(objectsRef.current[i], pos.x, pos.y)) { found = objectsRef.current[i]; break }
      }
      setSelectedId(found?.id ?? null)
      if (found) { isDraggingRef.current = true; dragStartRef.current = pos }
      return
    }

    if (tool === "text") {
      const text = prompt("テキストを入力:")
      if (!text) return
      const obj: DrawObject = { id: uid(), type: "text", x: pos.x, y: pos.y, text, color, lineWidth }
      objectsRef.current = [...objectsRef.current, obj]
      saveHistory(); redraw(); return
    }

    startPos.current = pos; isDrawingRef.current = true
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e)

    // カーソル更新（ホバー時）
    if (tool === "select" && !isDraggingRef.current && !isResizingRef.current) {
      if (selectedId) {
        const selObj = objectsRef.current.find(o => o.id === selectedId)
        if (selObj) {
          const handles = getHandles(selObj)
          const hit = handles.find(h => hitHandle(h, pos.x, pos.y))
          if (hit) { setCursorStyle(hit.cursor); return }
        }
      }
      const anyHit = objectsRef.current.slice().reverse().some(o => hitTest(o, pos.x, pos.y))
      setCursorStyle(anyHit ? "grab" : "default")
    }

    // リサイズ中
    if (tool === "select" && isResizingRef.current && dragStartRef.current && selectedId && activeHandleRef.current) {
      const dx = pos.x - dragStartRef.current.x; const dy = pos.y - dragStartRef.current.y
      dragStartRef.current = pos
      objectsRef.current = objectsRef.current.map(o =>
        o.id === selectedId ? resizeObject(o, activeHandleRef.current!, dx, dy) : o
      )
      redraw(); return
    }

    // 移動中
    if (tool === "select" && isDraggingRef.current && dragStartRef.current && selectedId) {
      const dx = pos.x - dragStartRef.current.x; const dy = pos.y - dragStartRef.current.y
      dragStartRef.current = pos
      objectsRef.current = objectsRef.current.map(o => o.id === selectedId ? moveObject(o, dx, dy) : o)
      redraw(); return
    }

    // 描画プレビュー
    if (!isDrawingRef.current || !startPos.current) return
    const { x: sx, y: sy } = startPos.current
    const base = { id: "__preview__", color, lineWidth, lineType }
    let preview: DrawObject | null = null
    if (tool === "line")      preview = { ...base, type: "line", x1: sx, y1: sy, x2: pos.x, y2: pos.y }
    if (tool === "rect")      preview = { ...base, type: "rect", x: sx, y: sy, w: pos.x - sx, h: pos.y - sy }
    if (tool === "circle")    preview = { ...base, type: "circle", cx: (sx + pos.x) / 2, cy: (sy + pos.y) / 2, rx: Math.abs(pos.x - sx) / 2, ry: Math.abs(pos.y - sy) / 2 }
    if (tool === "dimension") preview = { ...base, type: "dimension", x1: sx, y1: sy, x2: pos.x, y2: sy }
    previewObjRef.current = preview; redraw()
  }

  const onMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "select") {
      if (isResizingRef.current || isDraggingRef.current) saveHistory()
      isResizingRef.current = false; isDraggingRef.current = false
      activeHandleRef.current = null; dragStartRef.current = null
      setCursorStyle("default"); return
    }
    if (!isDrawingRef.current || !startPos.current) return
    const pos = getPos(e); const { x: sx, y: sy } = startPos.current
    previewObjRef.current = null; isDrawingRef.current = false; startPos.current = null
    const base = { id: uid(), color, lineWidth, lineType }
    let obj: DrawObject | null = null
    if (tool === "line")      obj = { ...base, type: "line", x1: sx, y1: sy, x2: pos.x, y2: pos.y }
    if (tool === "rect")      obj = { ...base, type: "rect", x: sx, y: sy, w: pos.x - sx, h: pos.y - sy }
    if (tool === "circle")    obj = { ...base, type: "circle", cx: (sx + pos.x) / 2, cy: (sy + pos.y) / 2, rx: Math.abs(pos.x - sx) / 2, ry: Math.abs(pos.y - sy) / 2 }
    if (tool === "dimension") obj = { ...base, type: "dimension", x1: sx, y1: sy, x2: pos.x, y2: sy }
    if (obj) { objectsRef.current = [...objectsRef.current, obj]; saveHistory(); redraw() }
  }

  const handleImageLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image(); const id = uid()
      img.onload = () => {
        imagesRef.current.set(id, img)
        const obj: DrawObject = { id, type: "image", dataUrl: ev.target?.result as string, x: 0, y: 0, w: CANVAS_W, h: CANVAS_H }
        objectsRef.current = [obj, ...objectsRef.current]
        saveHistory(); redraw()
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file); e.target.value = ""
  }

  const exportPNG = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const link = document.createElement("a"); link.download = "drawing.png"
    link.href = canvas.toDataURL("image/png"); link.click()
  }

  const clearCanvas = () => {
    if (!confirm("キャンバスをクリアしますか？")) return
    objectsRef.current = []; imagesRef.current.clear()
    setSelectedId(null); saveHistory(); redraw()
  }

  const computedCursor = tool === "select" ? cursorStyle
    : tool === "text" ? "text" : "crosshair"

  return (
    <div className="flex flex-col h-full" style={{ userSelect: "none" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white flex-shrink-0">
        <span className="text-sm font-semibold text-gray-700">図面作成</span>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageLoad} />
          <button onClick={() => fileRef.current?.click()} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50">画像読み込み</button>
          <button onClick={undo} disabled={!canUndo} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" title="元に戻す (⌘Z)">元に戻す</button>
          <button onClick={redo} disabled={!canRedo} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" title="やり直し (⌘Y)">やり直し</button>
          {selectedId && <button onClick={deleteSelected} className="text-xs px-3 py-1.5 border rounded hover:bg-red-50 text-red-500">削除</button>}
          <button onClick={exportPNG} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50">PNG書き出し</button>
          <button onClick={clearCanvas} className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 text-red-500">クリア</button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col items-center gap-1 px-1.5 py-3 border-r bg-white flex-shrink-0 w-12">
          {TOOLS.map(t => (
            <button key={t.key} title={t.label} onClick={() => setTool(t.key)}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${tool === t.key ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}>
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" dangerouslySetInnerHTML={{ __html: t.svg }} />
            </button>
          ))}
          <div className="my-1 w-6 border-t border-gray-200" />
          <button title="元に戻す (⌘Z)" onClick={undo} disabled={!canUndo}
            className="w-8 h-8 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M3 7 C3 4.5 5 2.5 7.5 2.5 C10 2.5 12 4.5 12 7 C12 9.5 10 11.5 7.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M3 4 L3 7 L6 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </button>
          <button title="やり直し (⌘Y)" onClick={redo} disabled={!canRedo}
            className="w-8 h-8 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M12 7 C12 4.5 10 2.5 7.5 2.5 C5 2.5 3 4.5 3 7 C3 9.5 5 11.5 7.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
              <path d="M12 4 L12 7 L9 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </button>
          <button title="クリア" onClick={clearCanvas}
            className="w-8 h-8 rounded flex items-center justify-center text-red-400 hover:bg-red-50">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-gray-100 flex items-start justify-start p-4">
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
            style={{ cursor: computedCursor, boxShadow: "0 2px 12px rgba(0,0,0,0.12)", display: "block", width: `${zoom}%`, maxWidth: "none" }}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp} />
        </div>
        <div className="w-36 flex flex-col gap-3 px-2 py-3 border-l bg-white flex-shrink-0 overflow-y-auto">
          <div>
            <p className="text-xs text-gray-400 mb-1.5 px-1">線の種類</p>
            {LINE_TYPES.map(lt => (
              <button key={lt.key} onClick={() => setLineType(lt.key)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left mb-1 transition-colors ${lineType === lt.key ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <svg width="28" height="10" style={{ flexShrink: 0 }}>
                  <line x1="2" y1="5" x2="26" y2="5" stroke={lineType === lt.key ? "#378add" : "#555"}
                    strokeWidth="1.5" strokeDasharray={lt.dash === "none" ? undefined : lt.dash} strokeLinecap="round" />
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
                <button key={c} onClick={() => setColor(c)}
                  style={{ background: c, width: 20, height: 20, borderRadius: "50%", border: color === c ? "2px solid #378add" : "2px solid transparent" }} />
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <div>
            <p className="text-xs text-gray-400 mb-1.5 px-1">線の太さ: {lineWidth}px</p>
            <input type="range" min="0.5" max="6" step="0.5" value={lineWidth}
              onChange={e => setLineWidth(Number(e.target.value))} className="w-full" />
          </div>
          <div className="border-t border-gray-100" />
          <div>
            <p className="text-xs text-gray-400 mb-1.5 px-1">ズーム: {zoom}%</p>
            <input type="range" min="30" max="200" step="10" value={zoom}
              onChange={e => setZoom(Number(e.target.value))} className="w-full" />
          </div>
          {selectedId && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs text-gray-400 mb-1.5 px-1">選択中</p>
                <button onClick={deleteSelected}
                  className="w-full text-xs px-2 py-1.5 border border-red-200 rounded text-red-500 hover:bg-red-50">
                  削除 (Delete)
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
