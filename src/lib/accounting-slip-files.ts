import { S3Client } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import { DRAFT_STATUS } from "@/lib/accounting-slip-access"
import { STATUS_RETURNED } from "@/lib/accounting-slip-approval"

export const ACCT_BUCKET = "japan-sleeve-system-files-936533876784"
export { ACCT_FILE_MAX_BYTES, ACCT_FILE_MAX_COUNT, ACCT_FILE_ACCEPT, ACCT_FILE_HELP, contentTypeFromName } from "@/lib/accounting-slip-files-shared"

export const acctS3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

// S3のキーに使うファイル名。パスの区切りや制御文字を取り除き、長さを制限する
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "_").replace(/\s+/g, " ").trim()
  const dot = cleaned.lastIndexOf(".")
  const ext = dot > 0 ? cleaned.slice(dot) : ""
  const base = (dot > 0 ? cleaned.slice(0, dot) : cleaned).slice(0, 80)
  return (base || "file") + ext.slice(0, 10)
}

export const keyPrefix = (slipId: string) => `eapp/accounting/${slipId}/`
// 推測できない乱数をキーに入れる（キーを知らない人は、ファイルを取れない）
export const newKey = (slipId: string, fileName: string) => `${keyPrefix(slipId)}${randomUUID()}_${safeFileName(fileName)}`

// 添付を追加・削除できるか：伝票の持ち主で、かつ、下書きまたは差戻しのとき
export async function checkFileEditable(userId: string, slipId: string): Promise<{ error: string; status: number } | null> {
  const slip = await prisma.acctSlip.findFirst({ where: { id: slipId, requester_id: userId }, select: { status: true } })
  if (!slip) return { error: "Not found", status: 404 }
  if (slip.status !== DRAFT_STATUS && slip.status !== STATUS_RETURNED) {
    return { error: "下書きまたは差戻しの伝票だけ、添付を変更できます", status: 400 }
  }
  return null
}
