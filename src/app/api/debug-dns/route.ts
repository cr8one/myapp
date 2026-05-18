import { NextResponse } from "next/server"
import dns from "dns/promises"

export async function GET() {
  try {
    const result = await dns.lookup("textract.ap-northeast-1.amazonaws.com")
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
