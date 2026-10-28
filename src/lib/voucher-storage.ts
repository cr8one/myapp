import { S3Client } from "@aws-sdk/client-s3"

export const voucherS3 = new S3Client({
  region: "ap-northeast-1",
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
})
export const VOUCHER_BUCKET = "japan-sleeve-system-files-936533876784"
export const VOUCHER_KEY_PREFIX = "voucher/"
export const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"]

export function isVoucherKey(key: unknown): key is string {
  return typeof key === "string" && key.startsWith(VOUCHER_KEY_PREFIX) && !key.includes("..")
}

export function fileExtension(name: string): string {
  const i = name.lastIndexOf(".")
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ""
}
