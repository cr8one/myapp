import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  if (!from || !to) return NextResponse.json({ error: "from/to required" }, { status: 400 })

  const bridgeUrl = process.env.PRINSER_BRIDGE_URL
  const bridgeKey = process.env.PRINSER_BRIDGE_API_KEY
  if (!bridgeUrl || !bridgeKey) return NextResponse.json({ error: "Bridge not configured" }, { status: 500 })

  const res = await fetch(`${bridgeUrl}/api/template/search?from=${from}&to=${to}`, {
    headers: {
      "X-Api-Key": bridgeKey,
      "ngrok-skip-browser-warning": "true",
    },
  })

  if (!res.ok) return NextResponse.json({ error: "Bridge error" }, { status: 502 })

  const data = await res.json()
  return NextResponse.json(data)
}
