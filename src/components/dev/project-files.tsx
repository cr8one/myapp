"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Paperclip, Upload, Trash2, Download, Eye, FileText, FileSpreadsheet, Mail } from "lucide-react"

type ProjectFile = {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  comment: string | null
  createdAt: string
  createdBy: string | null
}

type Props = {
  projectId: string
  mode: "view" | "edit"
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`

const getFileIcon = (mimeType: string) => {
  if (mimeType === "application/pdf") return <FileText className="text-red-500 shrink-0" size={20} />
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return <FileSpreadsheet className="text-green-600 shrink-0" size={20} />
  return <Mail className="text-blue-500 shrink-0" size={20} />
}

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.ms-excel": "Excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.ms-outlook": "Msg",
}

export default function ProjectFiles({ projectId, mode }: Props) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [comment, setComment] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/dev/projects/${projectId}/files`)
      .then((r) => r.json())
      .then(setFiles)
  }, [projectId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")

    if (!ALLOWED_TYPES[file.type]) {
      setError("PDF / Excel / Msg ファイルのみアップロードできます")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルサイズは10MB以下にしてください")
      return
    }

    setUploading(true)
    try {
      const urlRes = await fetch(`/api/dev/projects/${projectId}/files/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      })
      if (!urlRes.ok) { setError("アップロードURLの取得に失敗しました"); return }
      const { uploadUrl, fileKey } = await urlRes.json()

      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!s3Res.ok) { setError("S3へのアップロードに失敗しました"); return }

      const dbRes = await fetch(`/api/dev/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileKey,
          fileSize: file.size,
          mimeType: file.type,
          comment: comment || null,
        }),
      })
      if (!dbRes.ok) { setError("ファイル情報の登録に失敗しました"); return }

      const newFile = await dbRes.json()
      setFiles((prev) => [newFile, ...prev])
      setComment("")
    } catch {
      setError("アップロード中にエラーが発生しました")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDownload = async (file: ProjectFile) => {
    const res = await fetch(`/api/dev/projects/${projectId}/files/${file.id}`)
    const { url } = await res.json()
    const a = document.createElement("a")
    a.href = url
    a.download = file.fileName
    a.click()
  }

  const handlePreviewOrDownload = async (file: ProjectFile) => {
    const res = await fetch(`/api/dev/projects/${projectId}/files/${file.id}`)
    const { url } = await res.json()
    if (file.mimeType === "application/pdf") {
      setPreviewName(file.fileName)
      setPreviewUrl(url)
    } else {
      window.open(url, "_blank")
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm("このファイルを削除しますか？")) return
    await fetch(`/api/dev/projects/${projectId}/files/${fileId}`, { method: "DELETE" })
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip size={20} /> 添付ファイル
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* editモードのみ：アップロードエリア */}
          {mode === "edit" && (
            <>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                <p className="text-sm text-gray-500">PDF / Excel / Msg をクリックして選択</p>
                <p className="text-xs text-gray-400 mt-1">最大 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.xlsx,.xls,.msg"
                onChange={handleFileChange}
              />
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="コメント（任意）— ファイル選択前に入力してください"
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              {uploading && (
                <p className="text-sm text-blue-500 flex items-center gap-2">
                  <span className="animate-spin">⏳</span> アップロード中...
                </p>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </>
          )}

          {/* ファイル一覧 */}
          {files.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">添付ファイルはありません</p>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  {getFileIcon(file.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-gray-400">
                      {formatSize(file.fileSize)} · {new Date(file.createdAt).toLocaleDateString("ja-JP")}
                      {file.createdBy && ` · ${file.createdBy}`}
                    </p>
                    {file.comment && <p className="text-xs text-gray-500 mt-0.5">{file.comment}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {file.mimeType === "application/pdf" && (
                      <button
                        onClick={() => handlePreviewOrDownload(file)}
                        className="p-1.5 hover:bg-gray-200 rounded"
                        title="プレビュー"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 hover:bg-gray-200 rounded"
                      title="ダウンロード"
                    >
                      <Download size={16} />
                    </button>
                    {/* 削除はeditモードのみ */}
                    {mode === "edit" && (
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="p-1.5 hover:bg-red-100 text-red-500 rounded"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* PDFプレビューモーダル */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <span className="font-medium text-sm truncate">{previewName}</span>
              <button onClick={() => setPreviewUrl(null)} className="text-gray-500 hover:text-gray-800 ml-4">✕</button>
            </div>
            <iframe src={previewUrl} className="flex-1 rounded-b-lg" />
          </div>
        </div>
      )}
    </>
  )
}
