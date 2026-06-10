"use client"
import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X, Upload, Download, Trash2 } from "lucide-react"

type DaishiRecord = {
  id: string
  uid: string
  file_ai: string | null
  file_dxf: string | null
  file_pdf: string | null
  preview_image: string | null
  remarks: string | null
  created_at: string
  tags: { id: number; tag_name: string }[]
}

export default function DaishiDbDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [record, setRecord] = useState<DaishiRecord | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [dxfContent, setDxfContent] = useState<string | null>(null)
  const dxfContainerRef = useRef<HTMLDivElement>(null)
  const aiRef = useRef<HTMLInputElement>(null)
  const dxfRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  const fetchRecord = async () => {
    const res = await fetch(`/api/cad/daishi-db/${id}`)
    const data: DaishiRecord = await res.json()
    setRecord(data)
    setRemarks(data.remarks ?? "")
    setTags(data.tags.map(t => t.tag_name))

    // 署名付きURL取得
    const urls: Record<string, string> = {}
    await Promise.all([
      data.file_ai && fetch(`/api/cad/daishi-db/signed-url?key=${encodeURIComponent(data.file_ai)}`).then(r => r.json()).then(d => { urls["ai"] = d.url }),
      data.file_dxf && fetch(`/api/cad/daishi-db/signed-url?key=${encodeURIComponent(data.file_dxf)}`).then(r => r.json()).then(d => { urls["dxf"] = d.url }),
      data.file_pdf && fetch(`/api/cad/daishi-db/signed-url?key=${encodeURIComponent(data.file_pdf)}`).then(r => r.json()).then(d => { urls["pdf"] = d.url }),
      data.preview_image && fetch(`/api/cad/daishi-db/signed-url?key=${encodeURIComponent(data.preview_image)}`).then(r => r.json()).then(d => { urls["preview"] = d.url }),
    ].filter(Boolean))
    setSignedUrls(urls)
  }

  useEffect(() => { fetchRecord() }, [id])

  // DXFプレビュー
  useEffect(() => {
    if (!signedUrls["dxf"] || !dxfContainerRef.current) return
    const loadDxf = async () => {
      try {
        const res = await fetch(signedUrls["dxf"])
        const text = await res.text()
        setDxfContent(text)
      } catch (e) {
        console.error("DXF fetch error:", e)
      }
    }
    loadDxf()
  }, [signedUrls])

  useEffect(() => {
    if (!dxfContent || !dxfContainerRef.current) return
    const renderDxf = async () => {
      try {
        const { DxfViewer } = await import("dxf-viewer")
        const container = dxfContainerRef.current!
        container.innerHTML = ""
        const viewer = new DxfViewer(container, {
          autoResize: true,
          colorCorrection: true,
        })
        const blob = new Blob([dxfContent], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        await viewer.Load({ url, fonts: [] })
        URL.revokeObjectURL(url)
      } catch (e) {
        console.error("DXF render error:", e)
      }
    }
    renderDxf()
  }, [dxfContent])

  const handleSave = async () => {
    setSaving(true)
    await fetch(`/api/cad/daishi-db/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remarks, tags }),
    })
    setEditing(false)
    setSaving(false)
    fetchRecord()
  }

  const handleUpload = async (fileType: "ai" | "dxf" | "pdf", file: File) => {
    setUploading(fileType)
    const formData = new FormData()
    formData.append("id", id)
    formData.append("fileType", fileType)
    formData.append("file", file)
    const res = await fetch("/api/cad/daishi-db/upload", { method: "POST", body: formData })
    if (res.ok) {
      fetchRecord()
    } else {
      alert("アップロードに失敗しました")
    }
    setUploading(null)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput("")
  }
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const handleDelete = async () => {
    if (!confirm("この台紙データを削除しますか？")) return
    await fetch(`/api/cad/daishi-db/${id}`, { method: "DELETE" })
    router.push("/dashboard/cad/daishi-db")
  }

  if (!record) return <p className="p-8 text-gray-400 animate-pulse">読み込み中...</p>

  const FileRow = ({ label, fileKey, inputRef, fileType }: {
    label: string
    fileKey: "ai" | "dxf" | "pdf"
    inputRef: React.RefObject<HTMLInputElement | null>
    fileType: string
  }) => (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 w-16">{label}</span>
      {record[`file_${fileKey}` as keyof DaishiRecord] ? (
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">アップロード済み</span>
          <a href={signedUrls[fileKey]} download className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <Download className="w-3 h-3" /> ダウンロード
          </a>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <Upload className="w-3 h-3" /> 更新
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700"
        >
          <Upload className="w-3 h-3" />
          {uploading === fileKey ? "アップロード中..." : `${label}をアップロード`}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={fileType}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(fileKey, f); e.target.value = "" }}
      />
    </div>
  )

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/cad/daishi-db")}>← 一覧</Button>
          <h1 className="text-2xl font-bold">台紙DB No.{record.uid}</h1>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>キャンセル</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "保存中..." : "保存する"}</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleDelete} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
              <Button onClick={() => setEditing(true)}>編集</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左：情報 */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-base font-semibold text-gray-700 mb-4">ファイル</h2>
              <FileRow label="AI" fileKey="ai" inputRef={aiRef} fileType=".ai" />
              <FileRow label="DXF" fileKey="dxf" inputRef={dxfRef} fileType=".dxf" />
              <FileRow label="PDF" fileKey="pdf" inputRef={pdfRef} fileType=".pdf" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-base font-semibold text-gray-700 mb-3">備考</h2>
              {editing ? (
                <textarea
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  rows={3}
                  autoComplete="off"
                />
              ) : (
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{record.remarks || <span className="text-gray-300">—</span>}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-base font-semibold text-gray-700 mb-3">タグ</h2>
              {editing ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                      placeholder="タグを入力してEnter"
                      className="flex-1 border rounded px-3 py-1.5 text-sm"
                      autoComplete="off"
                    />
                    <Button variant="outline" size="sm" onClick={addTag}><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(t => (
                      <span key={t} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {t}
                        <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {record.tags.length > 0 ? record.tags.map(t => (
                    <span key={t.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{t.tag_name}</span>
                  )) : <span className="text-gray-300 text-sm">—</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右：プレビュー */}
        <div className="space-y-4">
          {/* PDFプレビュー */}
          {signedUrls["preview"] && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-base font-semibold text-gray-700 mb-3">PDFプレビュー</h2>
                <img src={signedUrls["preview"]} alt="preview" className="w-full rounded border border-gray-100" />
              </CardContent>
            </Card>
          )}
          {/* DXFプレビュー */}
          {record.file_dxf && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-base font-semibold text-gray-700 mb-3">DXFプレビュー</h2>
                <div ref={dxfContainerRef} className="w-full h-80 bg-gray-50 rounded border border-gray-100" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
