import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import path from "path"
import sharp from "sharp"

const s3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
const bedrock = new BedrockRuntimeClient({ region: "ap-northeast-1" })
const BUCKET = "japan-sleeve-system-files-936533876784"
const MODEL_ID = "jp.anthropic.claude-sonnet-4-6"

const FIELDS: Record<string, string> = {
  company_name: "会社名",
  industry: "業種",
  representative_name: "代表者",
  capital: "資本金",
  established_year_month: "設立年月",
  annual_revenue: "年商",
  employee_count: "従業員数",
  main_bank_name: "取引銀行名",
  main_bank_branch: "取引銀行支店名",
  postal_code: "郵便番号",
  address: "住所",
  tel: "電話番号",
  fax: "FAX番号",
  payment_terms: "支払条件",
  order_contact_dept: "発注担当部署",
  order_contact_name: "発注担当者名",
  order_items: "取扱品目",
  order_amount: "想定発注金額",
  future_prospects: "今後の見通し",
  requested_credit_limit: "希望与信限度額",
  manager_comment: "マネージャー所感",
  division_head_comment: "事業部長及び部長所感",
  accounting_comment: "経理部所感",
  approved_credit_limit: "取引限度設定額",
  remarks: "備考",
}

async function pdfFirstPageToPngBuffer(pdfBuffer: Buffer): Promise<Buffer> {
  const { createCanvas, Path2D, DOMMatrix, ImageData } = await import("@napi-rs/canvas")
  ;(globalThis as unknown as { Path2D: unknown }).Path2D = Path2D
  ;(globalThis as unknown as { DOMMatrix: unknown }).DOMMatrix = DOMMatrix
  ;(globalThis as unknown as { ImageData: unknown }).ImageData = ImageData
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")
  pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
  class NodeCanvasFactory {
    create(width: number, height: number) {
      const canvas = createCanvas(width, height)
      const context = canvas.getContext("2d")
      return { canvas, context }
    }
    reset(canvasAndContext: { canvas: import("@napi-rs/canvas").Canvas; context: unknown }, width: number, height: number) {
      canvasAndContext.canvas.width = width
      canvasAndContext.canvas.height = height
    }
    destroy(canvasAndContext: { canvas: import("@napi-rs/canvas").Canvas | null; context: unknown }) {
      canvasAndContext.canvas!.width = 0
      canvasAndContext.canvas!.height = 0
      canvasAndContext.canvas = null
      canvasAndContext.context = null
    }
  }
  const canvasFactory = new NodeCanvasFactory()
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer), CanvasFactory: NodeCanvasFactory }).promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 2.0 })
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height)
  await page.render({ canvasContext: canvasAndContext.context as unknown as CanvasRenderingContext2D, canvas: canvasAndContext.canvas as unknown as HTMLCanvasElement, viewport }).promise
  const pngBuffer = canvasAndContext.canvas.toBuffer("image/png")
  return sharp(pngBuffer).resize(1600, null, { withoutEnlargement: true }).toBuffer()
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await params
  const { key } = await req.json()
  if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 })

  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  const pdfBuffer = Buffer.from(await obj.Body!.transformToByteArray())

  let pngBuffer: Buffer
  try {
    pngBuffer = await pdfFirstPageToPngBuffer(pdfBuffer)
  } catch (e) {
    console.error("PDF画像化エラー:", e)
    return NextResponse.json({ error: "PDFの画像化に失敗しました" }, { status: 500 })
  }
  const base64Image = pngBuffer.toString("base64")

  const fieldList = Object.entries(FIELDS).map(([k, label]) => `- ${k}: ${label}`).join("\n")
  const prompt = `これは「取引限度設定書」という日本語の帳票をスキャンした画像です。手書き記入の場合があります。
以下のフィールドについて、画像から読み取れる値をJSON形式で返してください。読み取れない・記載がない項目は空文字列にしてください。
${fieldList}
出力は必ず上記キーのみを持つJSONオブジェクト1つだけとし、説明文やコードブロック記法（\`\`\`）は一切含めないでください。`

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: base64Image } },
          { type: "text", text: prompt },
        ],
      },
    ],
  }

  try {
    const res = await bedrock.send(new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    }))
    const responseBody = JSON.parse(Buffer.from(res.body).toString("utf-8"))
    const rawText: string = responseBody.content?.[0]?.text ?? "{}"
    const cleaned = rawText.replace(/```json|```/g, "").trim()
    const extracted = JSON.parse(cleaned)
    return NextResponse.json({ extracted, raw_text: rawText })
  } catch (e) {
    console.error("Bedrock OCRエラー:", e)
    return NextResponse.json({ error: "OCR処理に失敗しました" }, { status: 500 })
  }
}