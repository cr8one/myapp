import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url)
    const response = NextResponse.redirect(loginUrl)
    // 古いセッションクッキーを削除してからリダイレクト
    response.cookies.delete("authjs.session-token")
    response.cookies.delete("__Secure-authjs.session-token")
    response.cookies.delete("authjs.csrf-token")
    response.cookies.delete("__Host-authjs.csrf-token")
    return response
  }
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)",
  ],
  runtime: "nodejs",
}
