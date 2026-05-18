import { NextResponse } from "next/server"
import dns from "dns/promises"

export async function GET() {
  const hosts = [
    "textract.ap-northeast-1.amazonaws.com",
    "s3.ap-northeast-1.amazonaws.com",
    "secretsmanager.ap-northeast-1.amazonaws.com",
    "google.com",
  ]
  const results: Record<string, string> = {}
  for (const host of hosts) {
    try {
      const r = await dns.lookup(host)
      results[host] = r.address
    } catch (e) {
      results[host] = `FAILED: ${String(e)}`
    }
  }
  return NextResponse.json(results)
}
