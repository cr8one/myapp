import { NextRequest, NextResponse } from "next/server"
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"
import sharp from "sharp"
import { execFile } from "child_process"
import { promisify } from "util"
import { writeFile, readFile, mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/permissions"
import { voucherS3, VOUCHER_BUCKET, ALLOWED_EXTENSIONS, isVoucherKey, fileExtension } from "@/lib/voucher-storage"

const execFileAsync = promisify(execFile)
const bedrock = new BedrockRuntimeClient({ region: "ap-northeast-1" })
const MODEL_ID = "global.anthropic.claude-sonnet-5"
const MAX_BYTES = 20 * 1024 * 1024

async function toPngBuffer(buf: Buffer, ext: string): Promise<Buffer> {
  if (ext !== "pdf") {
    return sharp(buf).rotate().resize(1600, null, { withoutEnlargement: true }).png().toBuffer()
  }
  const dir = await mkdtemp(join(tmpdir(), "voucher-ocr-"))
  const pdfPath = join(dir, "input.pdf")
  const outPrefix = join(dir, "out")
  try {
    await writeFile(pdfPath, buf)
    await execFileAsync("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", "1", pdfPath, outPrefix])
    const png = await readFile(`${outPrefix}-1.png`)
    return sharp(png).resize(1600, null, { withoutEnlargement: true }).toBuffer()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")
const dateStr = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(str(v)) ? str(v) : "")

export async function POST(req: NextRequest) {
  const denied = await requirePermission("voucherEdit")
  if (denied) return denied
  const { key } = await req.json()
  if (!isVoucherKey(key)) return NextResponse.json({ error: "key が正しくありません" }, { status: 400 })
  const ext = fileExtension(key)
  if (!ALLOWED_EXTENSIONS.includes(ext)) return NextResponse.json({ error: "PDF・PNG・JPEGのみ読み取れます" }, { status: 400 })

  const obj = await voucherS3.send(new GetObjectCommand({ Bucket: VOUCHER_BUCKET, Key: key }))
  if ((obj.ContentLength ?? 0) > MAX_BYTES) return NextResponse.json({ error: "ファイルが大きすぎます（20MBまで）" }, { status: 400 })
  const fileBuffer = Buffer.from(await obj.Body!.transformToByteArray())

  let pngBuffer: Buffer
  try {
    pngBuffer = await toPngBuffer(fileBuffer, ext)
  } catch (e) {
    console.error("証憑の画像化エラー:", e)
    return NextResponse.json({ error: "ファイルの画像化に失敗しました" }, { status: 500 })
  }

  const docTypes = (await prisma.mVoucherOption.findMany({ where: { category: "doc_type" }, orderBy: { sort_order: "asc" } })).map(o => o.value)
  const docTypeList = docTypes.length > 0 ? docTypes.join("、") : "指定なし"
  const prompt = `これは取引先から受け取った請求書または領収書の画像（PDFの場合は1ページ目）です。次の項目を読み取り、JSONオブジェクト1つだけで返してください。読み取れない項目は空文字列にしてください。説明文やコードブロック記法は一切含めないでください。
- doc_type: 書類区分。次のいずれか（当てはまらなければ空文字列）：${docTypeList}
- issue_date: 書類に記載された発行日・請求日。YYYY-MM-DD形式
- service_date: 利用日・乗車日・購入日・納品日など、取引そのものが行われた日。書類に明記されていなければ空文字列。YYYY-MM-DD形式
- partner_name: 書類を発行した取引先（請求元・領収書の発行者）の名称。株式会社などの法人格を含める
- amount: 請求金額または領収金額の税込合計。数字のみ（カンマ・円記号なし）
- remarks: 但し書きや件名など、内容が分かる短い説明（30文字以内）`

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/png", data: pngBuffer.toString("base64") } },
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
    const x = JSON.parse(rawText.replace(/```json|```/g, "").trim())
    const digits = str(x.amount).replace(/[^\d]/g, "")
    const docType = str(x.doc_type)
    return NextResponse.json({
      extracted: {
        doc_type: docTypes.includes(docType) ? docType : "",
        issue_date: dateStr(x.issue_date),
        service_date: dateStr(x.service_date),
        partner_name: str(x.partner_name),
        amount: digits && Number(digits) <= 2147483647 ? digits : "",
        remarks: str(x.remarks),
      },
    })
  } catch (e) {
    console.error("証憑のOCRエラー:", e)
    return NextResponse.json({ error: "OCR処理に失敗しました" }, { status: 500 })
  }
}
