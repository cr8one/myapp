import { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import { getSessionUser } from "@/lib/permissions"
import { safeFileName } from "@/lib/accounting-slip-files"

export const REG_BUCKET = "japan-sleeve-system-files-936533876784"
import { REG_MAX_BYTES } from "@/lib/eapp-regulations-shared"
export { REG_MAX_BYTES, isPdfName } from "@/lib/eapp-regulations-shared"
export const REG_PREFIX = "eapp/regulations/"

export const regS3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})

// 規定等を見られるのは、ログインしている全員。登録・差し替え・変更・削除ができるのは、システム管理者と経理担当
export async function getRegulationViewer() {
  const user = await getSessionUser()
  if (!user) return null
  const canManage = user.role === "ADMIN" || user.permission?.isAccountingStaff === true
  return { userId: user.id, name: user.name ?? user.email, canManage }
}

// 推測できない乱数をキーに入れる
export const newRegulationKey = (fileName: string) => `${REG_PREFIX}${randomUUID()}_${safeFileName(fileName)}`

export async function deleteRegulationObject(key: string) {
  await regS3.send(new DeleteObjectCommand({ Bucket: REG_BUCKET, Key: key })).catch(e => console.error("規定等のファイルの削除エラー:", e))
}

// 登録の前に、S3の実物を検査する：大きさと、先頭が「%PDF-」であること。違えば、実物を消して、エラーを返す
export async function verifyPdfObject(key: string): Promise<string | null> {
  let size = 0
  try {
    const head = await regS3.send(new HeadObjectCommand({ Bucket: REG_BUCKET, Key: key }))
    size = head.ContentLength ?? 0
  } catch {
    return "アップロードを確認できません"
  }
  if (size <= 0 || size > REG_MAX_BYTES) {
    await deleteRegulationObject(key)
    return `ファイルの大きさは、${REG_MAX_BYTES / 1024 / 1024}MBまでです`
  }
  try {
    const got = await regS3.send(new GetObjectCommand({ Bucket: REG_BUCKET, Key: key, Range: "bytes=0-4" }))
    const bytes = await got.Body?.transformToByteArray()
    if (Buffer.from(bytes ?? []).toString("latin1") !== "%PDF-") {
      await deleteRegulationObject(key)
      return "PDFファイルではありません"
    }
  } catch {
    return "ファイルを確認できません"
  }
  return null
}

export const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max)
