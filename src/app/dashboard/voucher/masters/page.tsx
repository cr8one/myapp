"use client"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Option = { id: string; category: string; value: string; sort_order: number }
type UserOption = { id: string; name: string | null }
type Partner = {
  id: string
  name: string
  furigana: string | null
  staff_user_id: string | null
  media_option_id: string | null
  payment_option_id: string | null
  transfer_option_id: string | null
  remarks: string | null
  staff: { id: string; name: string | null } | null
  media_option: { id: string; value: string } | null
  payment_option: { id: string; value: string } | null
  transfer_option: { id: string; value: string } | null
}
type Serial = { next_value: number; max_used: number }
type Tab = "doc_type" | "media_type" | "payment_method" | "transfer_method" | "partners" | "serial"

const TABS: { key: Tab; label: string }[] = [
  { key: "doc_type", label: "書類区分" },
  { key: "media_type", label: "媒体区分" },
  { key: "payment_method", label: "支払方法" },
  { key: "transfer_method", label: "振込" },
  { key: "partners", label: "取引先" },
  { key: "serial", label: "採番" },
]
const OPTION_DESCRIPTION: Record<string, string> = {
  doc_type: "証憑の書類区分の選択肢です（請求書・領収書など）。名前を変えたり削除したりしても、登録済みの証憑には影響しません。",
  media_type: "証憑を受け取った媒体の選択肢です（Webサイト・メール・スキャンなど）。登録済みの証憑には影響しません。",
  payment_method: "支払方法の選択肢です。登録済みの証憑には影響しません。",
  transfer_method: "振込の選択肢です。登録済みの証憑には影響しません。",
}
const emptyPartner = { name: "", furigana: "", staff_user_id: "", media_option_id: "", payment_option_id: "", transfer_option_id: "", remarks: "" }
type PartnerForm = typeof emptyPartner & { id: string | null }

async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, data }
}

const btnPrimary = "px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800"
const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"

export default function VoucherMastersPage() {
  const [tab, setTab] = useState<Tab>("doc_type")
  const [options, setOptions] = useState<Option[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [serial, setSerial] = useState<Serial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [optForm, setOptForm] = useState<{ id: string | null; value: string } | null>(null)
  const [partnerForm, setPartnerForm] = useState<PartnerForm | null>(null)
  const [serialInput, setSerialInput] = useState("")

  const load = async () => {
    setLoading(true)
    const [o, p, u, s] = await Promise.all([
      request("/api/voucher/masters/options", "GET"),
      request("/api/voucher/masters/partners", "GET"),
      request("/api/users/list", "GET"),
      request("/api/voucher/masters/serial", "GET"),
    ])
    setOptions(o.ok && Array.isArray(o.data) ? o.data : [])
    setPartners(p.ok && Array.isArray(p.data) ? p.data : [])
    setUsers(u.ok && Array.isArray(u.data) ? u.data : [])
    setSerial(s.ok ? s.data : null)
    if (s.ok) setSerialInput(String(s.data.next_value))
    if (!o.ok) setError(o.data?.error ?? "読み込みに失敗しました")
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const switchTab = (t: Tab) => { setTab(t); setError(""); setOptForm(null); setPartnerForm(null) }

  const saveOption = async () => {
    if (!optForm) return
    setError("")
    const r = optForm.id
      ? await request(`/api/voucher/masters/options/${optForm.id}`, "PUT", { value: optForm.value })
      : await request("/api/voucher/masters/options", "POST", { category: tab, value: optForm.value })
    if (!r.ok) { setError(r.data?.error ?? "保存に失敗しました"); return }
    setOptForm(null)
    await load()
  }
  const removeOption = async (o: Option) => {
    if (!confirm(`「${o.value}」を削除しますか？`)) return
    setError("")
    const r = await request(`/api/voucher/masters/options/${o.id}`, "DELETE")
    if (!r.ok) { setError(r.data?.error ?? "削除に失敗しました"); return }
    await load()
  }

  const openPartnerEdit = (p: Partner) => setPartnerForm({
    id: p.id, name: p.name, furigana: p.furigana ?? "", staff_user_id: p.staff_user_id ?? "",
    media_option_id: p.media_option_id ?? "", payment_option_id: p.payment_option_id ?? "",
    transfer_option_id: p.transfer_option_id ?? "", remarks: p.remarks ?? "",
  })
  const savePartner = async () => {
    if (!partnerForm) return
    setError("")
    const { id, ...body } = partnerForm
    const r = id
      ? await request(`/api/voucher/masters/partners/${id}`, "PUT", body)
      : await request("/api/voucher/masters/partners", "POST", body)
    if (!r.ok) { setError(r.data?.error ?? "保存に失敗しました"); return }
    setPartnerForm(null)
    await load()
  }
  const removePartner = async (p: Partner) => {
    if (!confirm(`「${p.name}（${p.staff?.name ?? "担当なし"}）」を削除しますか？`)) return
    setError("")
    const r = await request(`/api/voucher/masters/partners/${p.id}`, "DELETE")
    if (!r.ok) { setError(r.data?.error ?? "削除に失敗しました"); return }
    await load()
  }

  const saveSerial = async () => {
    setError("")
    const r = await request("/api/voucher/masters/serial", "PATCH", { next_value: Number(serialInput) })
    if (!r.ok) { setError(r.data?.error ?? "保存に失敗しました"); return }
    await load()
  }

  const isOptionTab = tab !== "partners" && tab !== "serial"
  const optionList = options.filter(o => o.category === tab)
  const optionsOf = (category: string) => options.filter(o => o.category === category)
  const pad = (n: number) => String(n).padStart(6, "0")

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">証憑管理マスタ</h1>

      <div className="flex gap-1 border-b border-gray-200 mb-6 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-slate-700 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <>
          {isOptionTab && (
            <div>
              <div className="flex items-center justify-between mb-4 gap-4">
                <p className="text-xs text-gray-400">{OPTION_DESCRIPTION[tab]}</p>
                <button onClick={() => setOptForm({ id: null, value: "" })} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
                  <Plus className="w-4 h-4" /> 追加
                </button>
              </div>
              {optForm && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex gap-2">
                    <input autoComplete="off" className={inputCls} value={optForm.value} onChange={e => setOptForm({ ...optForm, value: e.target.value })} />
                    <button onClick={saveOption} className={btnPrimary}>保存</button>
                    <button onClick={() => setOptForm(null)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
                  </div>
                </div>
              )}
              {optionList.length === 0 ? (
                <p className="text-sm text-gray-400">まだ登録されていません。</p>
              ) : (
                <div className="space-y-2">
                  {optionList.map(o => (
                    <div key={o.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                      <span className="flex-1 font-medium text-gray-900">{o.value}</span>
                      <button onClick={() => setOptForm({ id: o.id, value: o.value })} className="p-1 text-gray-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => removeOption(o)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "partners" && (
            <div>
              <div className="flex items-center justify-between mb-4 gap-4">
                <p className="text-xs text-gray-400">
                  取引先ごとの、担当者別の既定値です。証憑の登録時に取引先を選ぶと、登録者が担当になっている行の支払方法・振込・媒体区分が自動で入ります。
                </p>
                <button onClick={() => setPartnerForm({ ...emptyPartner, id: null })} className="flex items-center gap-1 px-3 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-800 shrink-0">
                  <Plus className="w-4 h-4" /> 追加
                </button>
              </div>
              {partnerForm && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><label className="text-xs text-gray-500">取引先名</label>
                      <input autoComplete="off" className={inputCls} value={partnerForm.name} onChange={e => setPartnerForm({ ...partnerForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">フリガナ</label>
                      <input autoComplete="off" className={inputCls} value={partnerForm.furigana} onChange={e => setPartnerForm({ ...partnerForm, furigana: e.target.value })} />
                    </div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">担当</label>
                      <select className={inputCls} value={partnerForm.staff_user_id} onChange={e => setPartnerForm({ ...partnerForm, staff_user_id: e.target.value })}>
                        <option value="">未選択</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">媒体区分</label>
                      <select className={inputCls} value={partnerForm.media_option_id} onChange={e => setPartnerForm({ ...partnerForm, media_option_id: e.target.value })}>
                        <option value="">未選択</option>
                        {optionsOf("media_type").map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">支払方法</label>
                      <select className={inputCls} value={partnerForm.payment_option_id} onChange={e => setPartnerForm({ ...partnerForm, payment_option_id: e.target.value })}>
                        <option value="">未選択</option>
                        {optionsOf("payment_method").map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs text-gray-500">振込</label>
                      <select className={inputCls} value={partnerForm.transfer_option_id} onChange={e => setPartnerForm({ ...partnerForm, transfer_option_id: e.target.value })}>
                        <option value="">未選択</option>
                        {optionsOf("transfer_method").map(o => <option key={o.id} value={o.id}>{o.value}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1"><label className="text-xs text-gray-500">備考</label>
                    <input autoComplete="off" className={inputCls} value={partnerForm.remarks} onChange={e => setPartnerForm({ ...partnerForm, remarks: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={savePartner} className={btnPrimary}>保存</button>
                    <button onClick={() => setPartnerForm(null)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">キャンセル</button>
                  </div>
                </div>
              )}
              {partners.length === 0 ? (
                <p className="text-sm text-gray-400">まだ登録されていません。</p>
              ) : (
                <div className="space-y-2">
                  {partners.map(p => (
                    <div key={p.id} className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm text-sm">
                      <div className="w-64">
                        <div className="font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.furigana ?? ""}</div>
                      </div>
                      <span className="w-28 text-gray-700">{p.staff?.name ?? "担当なし"}</span>
                      <span className="w-24 text-gray-500">{p.media_option?.value ?? "-"}</span>
                      <span className="w-24 text-gray-500">{p.payment_option?.value ?? "-"}</span>
                      <span className="w-24 text-gray-500">{p.transfer_option?.value ?? "-"}</span>
                      <span className="flex-1 text-xs text-gray-400 line-clamp-2" title={p.remarks ?? ""}>{p.remarks ?? ""}</span>
                      <button onClick={() => openPartnerEdit(p)} className="p-1 text-gray-400 hover:text-blue-500"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => removePartner(p)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "serial" && (
            <div className="max-w-md">
              <p className="text-xs text-gray-400 mb-4">
                証憑に振るファイルNoの次の番号です。FileMakerから移行する場合は、運用の開始前に、移行後の番号の続きを設定してください。すでに使われている番号以下には設定できません。設定できるのは管理者だけです。
              </p>
              {serial ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-700">次の番号：<span className="font-mono font-bold">{pad(serial.next_value)}</span></div>
                  <div className="text-sm text-gray-700">使用済みの最大番号：<span className="font-mono">{serial.max_used > 0 ? pad(serial.max_used) : "なし"}</span></div>
                  <div className="flex gap-2">
                    <input autoComplete="off" type="number" className={inputCls} value={serialInput} onChange={e => setSerialInput(e.target.value)} />
                    <button onClick={saveSerial} className={btnPrimary}>保存</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">採番の設定を読み込めませんでした。</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
