"use client"
import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

type User = { id: string; name: string; department?: string }
type SealSupply = {
  id: number
  serialCode: string
  issueDate: string
  productCode: string
  orderNo: string
  partName: string
  qtyTokyoToOutsource: number
  company: { name: string } | null
  companyName: string | null
  supplier: User | null
  supplierName: string | null
  salesDepartment: string | null
  salesPerson: User | null
  salesPersonName: string | null
  pdfExportedAt: string | null
}

function fmtDate(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "/")
}

function fmtDateTime(d: string | null) {
  if (!d) return ""
  return new Date(d).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default function SupplyPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [supply, setSupply] = useState<SealSupply | null>(null)
  const [departments, setDepartments] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedDept, setSelectedDept] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedUserName, setSelectedUserName] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchSupply = useCallback(async () => {
    const res = await fetch(`/api/ssss/supplies/${id}`)
    const data = await res.json()
    setSupply(data)
    if (data.salesDepartment) setSelectedDept(data.salesDepartment)
    if (data.salesPerson) {
      setSelectedUserId(data.salesPerson.id)
      setSelectedUserName(data.salesPerson.name ?? "")
    } else if (data.salesPersonName) {
      setSelectedUserName(data.salesPersonName)
    }
  }, [id])

  const fetchDepartments = useCallback(async () => {
    const res = await fetch("/api/users")
    const data: User[] = await res.json()
    const depts = Array.from(new Set(data.map(u => u.department).filter(Boolean))) as string[]
    setDepartments(depts.sort())
  }, [])

  const fetchUsersByDept = useCallback(async (dept: string) => {
    const res = await fetch(`/api/users?department=${encodeURIComponent(dept)}`)
    const data: User[] = await res.json()
    setUsers(data)
  }, [])

  useEffect(() => {
    fetchSupply()
    fetchDepartments()
  }, [fetchSupply, fetchDepartments])

  useEffect(() => {
    if (selectedDept) fetchUsersByDept(selectedDept)
    else setUsers([])
  }, [selectedDept, fetchUsersByDept])

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept)
    setSelectedUserId("")
    setSelectedUserName("")
  }

  const handleUserChange = (userId: string) => {
    const user = users.find(u => u.id === userId)
    setSelectedUserId(userId)
    setSelectedUserName(user?.name ?? "")
  }

  const handleSaveAndPrint = async () => {
    setSaving(true)
    const now = new Date().toISOString()
    await fetch(`/api/ssss/supplies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...supply,
        companyId: supply?.company ? undefined : null,
        salesDepartment: selectedDept || null,
        salesPersonId: selectedUserId || null,
        salesPersonName: selectedUserName || null,
        pdfExportedAt: now,
        qtyShizuokaToTokyo: supply?.qtyTokyoToOutsource ?? 0,
        qtyTokyoToOutsource: supply?.qtyTokyoToOutsource ?? 0,
        qtyTokyoStock: 0,
      }),
    })
    await fetchSupply()
    setSaving(false)
    window.print()
  }

  if (!supply) return <div className="p-8 text-gray-400">読み込み中...</div>

  const companyName = supply.company?.name ?? supply.companyName ?? ""
  const supplierName = supply.supplier?.name ?? supply.supplierName ?? ""

  return (
    <>
      {/* 印刷時に非表示にするUI */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .print-page { margin: 0; padding: 0; }
        }
        @page { size: A4; margin: 15mm; }
      `}</style>

      {/* 操作パネル */}
      <div className="no-print fixed top-4 right-4 z-50 flex flex-col gap-2">
        {/* PDF出力済み情報 */}
        {supply.pdfExportedAt && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
            ✓ 出力済み：{fmtDateTime(supply.pdfExportedAt)}
          </div>
        )}
        <button
          onClick={handleSaveAndPrint}
          disabled={saving}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors disabled:opacity-50"
        >
          🖨 {saving ? "保存中..." : "印刷 / PDF出力"}
        </button>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
        >
          ← 戻る
        </button>
      </div>

      {/* 営業担当選択パネル */}
      <div className="no-print fixed top-4 left-4 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72">
        <p className="text-xs font-semibold text-gray-600 mb-3">JS営業担当者設定</p>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">部署</label>
            <select
              value={selectedDept}
              onChange={e => handleDeptChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          {selectedDept && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">担当者</label>
              <select
                value={selectedUserId}
                onChange={e => handleUserChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 印刷コンテンツ */}
      <div className="print-page max-w-[210mm] mx-auto bg-white p-8 min-h-screen">

        {/* ===== 上半分：送り状 ===== */}
        <div style={{ minHeight: "45%" }}>
          {/* ヘッダー */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xl font-bold">{companyName}</p>
              <p className="text-lg font-bold">御中</p>
              <div className="border-b-2 border-black w-48 mt-1" />
            </div>
            <div className="text-right text-sm">
              <p className="font-bold text-base">{supply.serialCode}</p>
              <p>発行日　{fmtDate(supply.issueDate)}</p>
            </div>
          </div>

          <p className="text-sm mb-5">下記の摘要にてサンプルシールを支給いたします。</p>

          {/* 明細表 */}
          <table className="w-full border-collapse text-sm mb-6">
            <tbody>
              {[
                { label: "品　番", value: supply.productCode },
                { label: "受注ＮＯ", value: supply.orderNo },
                { label: "貼り付けパーツ", value: supply.partName },
                { label: "支給枚数", value: `${supply.qtyTokyoToOutsource}　枚` },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td className="border border-gray-400 px-4 py-2 text-center font-medium w-36 bg-gray-50">{label}</td>
                  <td className="border border-gray-400 px-4 py-2">{value}</td>
                </tr>
              ))}
              {/* JS営業担当者行 - 部署と担当者の2列 */}
              <tr>
                <td className="border border-gray-400 px-4 py-2 text-center font-medium w-36 bg-gray-50">JS営業担当者</td>
                <td className="border border-gray-400 p-0">
                  <div className="flex h-full">
                    <div className="flex-1 px-4 py-2 border-r border-gray-400">
                      {selectedDept}
                    </div>
                    <div className="flex-1 px-4 py-2">
                      {selectedUserName}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 右下：JSロゴ・支給担当者 */}
          <div className="flex justify-end">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 mb-1">
                <Image src="/js-logo.png" alt="JS" width={32} height={24} className="object-contain" />
                <Image src="/js-company-name.png" alt="株式会社ジャパン・スリーブ" width={160} height={24} className="object-contain" />
              </div>
              <p className="text-sm">支給担当：　{supplierName}</p>
            </div>
          </div>
        </div>

        {/* キリトリ線 */}
        <div className="flex items-center gap-2 my-6">
          <div className="flex-1 border-t border-dashed border-gray-400" />
          <span className="text-xs text-gray-400 whitespace-nowrap">キ リ ト リ</span>
          <div className="flex-1 border-t border-dashed border-gray-400" />
        </div>

        {/* ===== 下半分：受領書 ===== */}
        <div>
          {/* ヘッダー：JSロゴ＋支給担当者 様 */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Image src="/js-logo.png" alt="JS" width={32} height={24} className="object-contain" />
              <Image src="/js-company-name.png" alt="株式会社ジャパン・スリーブ" width={160} height={24} className="object-contain" />
            </div>
            <div className="flex items-baseline gap-2 border-b border-black w-48">
              <p className="font-bold">{supplierName}</p>
              <p className="text-sm">様</p>
            </div>
          </div>

          <p className="text-sm mb-5">下記の摘要にてサンプルシールを受領しました。</p>

          {/* 明細表 */}
          <table className="w-full border-collapse text-sm mb-6">
            <tbody>
              {[
                { label: "品　番", value: supply.productCode },
                { label: "受注ＮＯ", value: supply.orderNo },
                { label: "貼り付けパーツ", value: supply.partName },
                { label: "支給枚数", value: `${supply.qtyTokyoToOutsource}　枚` },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td className="border border-gray-400 px-4 py-2 text-center font-medium w-36 bg-gray-50">{label}</td>
                  <td className="border border-gray-400 px-4 py-2">{value}</td>
                </tr>
              ))}
              <tr>
                <td className="border border-gray-400 px-4 py-2 text-center font-medium w-36 bg-gray-50">JS営業担当者</td>
                <td className="border border-gray-400 p-0">
                  <div className="flex h-full">
                    <div className="flex-1 px-4 py-2 border-r border-gray-400">
                      {selectedDept}
                    </div>
                    <div className="flex-1 px-4 py-2">
                      {selectedUserName}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 右下：支給先会社名＋受領日・サイン欄 */}
          <div className="flex justify-end">
            <div className="text-right">
              <p className="text-base font-bold mb-3">{companyName}</p>
              <table className="border-collapse text-sm ml-auto">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-4 py-2 bg-gray-50 whitespace-nowrap">受領日</td>
                    <td className="border border-gray-400 px-8 py-2 w-36"></td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-4 py-2 bg-gray-50">サイン</td>
                    <td className="border border-gray-400 px-8 py-2 w-36"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PDF出力済み情報（印刷時のみ表示） */}
        {supply.pdfExportedAt && (
          <div className="mt-4 text-xs text-gray-300 text-right" style={{ display: "none" }}>
            出力日時: {fmtDateTime(supply.pdfExportedAt)}
          </div>
        )}
      </div>
    </>
  )
}
