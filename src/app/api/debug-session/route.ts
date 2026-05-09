import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  return NextResponse.json({ 
    session: session ? { id: session.user?.id, role: session.user?.role, email: session.user?.email } : null,
    headers: {
      cookie: req.headers.get("cookie") ? "exists" : "missing",
    }
  })
}
