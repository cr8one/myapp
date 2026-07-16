"use client"
import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import JsBarcode from "jsbarcode"

export default function PosLabelPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const edaban = searchParams.get("edaban") ?? ""
  const genre = searchParams.get("genre") ?? ""
  const hinmoku = searchParams.get("hinmoku") ?? ""
  const condition = searchParams.get("condition") ?? ""

  const [uidNtemp, setUidNtemp] = useState("")
  const [loading, setLoading] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    fetch(`/api/dlms/dielines/${id}`)
      .then(res => res.json())
      .then(data => {
        setUidNtemp(data.uid_ntemp ?? "")
        setLoading(false)
      })
  }, [id])

  const codeValue = uidNtemp ? `${uidNtemp}-${edaban}` : ""

  useEffect(() => {
    if (svgRef.current && codeValue) {
      JsBarcode(svgRef.current, codeValue, {
        format: "CODE39",
        displayValue: false,
        height: 30,
        width: 1.3,
        margin: 0,
      })
    }
  }, [codeValue])

  return (
    <div className="p-8">
      <style>{`
        @media print {
          @page { size: 180mm 12mm; margin: 0; }
          body * { visibility: hidden; }
          #pos-label, #pos-label * { visibility: visible; }
          #pos-label {
            position: fixed; top: 0; left: 0;
            width: 180mm; height: 12mm;
          }
        }
      `}</style>

      <div className="max-w-2xl mx-auto no-print">
        <button onClick={() => router.back()} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" />戻る
        </button>
        <h1 className="text-xl font-bold text-gray-800 mb-4">バーコード印刷画面</h1>

        {loading ? (
          <p className="text-gray-400 text-sm">読み込み中...</p>
        ) : (
          <>
            <div
              id="pos-label"
              className="border border-black flex items-center justify-between px-3 bg-white"
              style={{ width: "180mm", height: "12mm" }}
            >
              <span className="text-sm font-bold" style={{ width: "14%" }}>{genre}</span>
              <span className="text-sm font-bold" style={{ width: "18%" }}>{hinmoku}</span>
              <span className="text-sm font-bold" style={{ width: "22%" }}>{condition}</span>
              <span className="text-sm font-bold" style={{ width: "18%" }}>{codeValue}</span>
              <svg ref={svgRef} style={{ width: "28%", height: "10mm" }} />
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />戻る
              </Button>
              <Button onClick={() => window.print()} className="flex items-center gap-1.5">
                <Printer className="w-4 h-4" />印刷する
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
