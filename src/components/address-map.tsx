import { Map } from "lucide-react"

// 住所の文字をそのまま検索語にして、Googleマップを埋め込む（座標の取得や、APIキーは使わない）。
// 住所録の詳細画面と同じ作り。郵便番号も住所も空のときは、何も出さない
export default function AddressMap({ postalCode, addresses }: {
  postalCode?: string | null
  addresses: (string | null | undefined)[]
}) {
  const query = [postalCode, ...addresses].filter(Boolean).join(" ")
  if (!query) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">地図</span>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <Map className="w-3 h-3" /> 大きな地図で見る
        </a>
      </div>
      <iframe
        src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=ja`}
        className="w-full h-64 rounded border border-gray-200"
        loading="lazy"
      />
    </div>
  )
}
