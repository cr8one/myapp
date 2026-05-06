"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // 認証チェック用APIを呼ぶ
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      setError("メールアドレスまたはパスワードが正しくありません")
      setLoading(false)
      return
    }

    // ブラウザにパスワード保存を促すため、フォームをネイティブsubmitで再送信
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "/api/auth/callback/credentials"
    form.style.display = "none"

    const emailInput = document.createElement("input")
    emailInput.name = "email"
    emailInput.value = email
    emailInput.autocomplete = "email"

    const passwordInput = document.createElement("input")
    passwordInput.type = "password"
    passwordInput.name = "password"
    passwordInput.value = password
    passwordInput.autocomplete = "current-password"

    const csrfInput = document.createElement("input")
    csrfInput.name = "csrfToken"

    // CSRFトークン取得
    const csrfRes = await fetch("/api/auth/csrf")
    const { csrfToken } = await csrfRes.json()
    csrfInput.value = csrfToken

    const redirectInput = document.createElement("input")
    redirectInput.name = "callbackUrl"
    redirectInput.value = "/dashboard"

    form.appendChild(emailInput)
    form.appendChild(passwordInput)
    form.appendChild(csrfInput)
    form.appendChild(redirectInput)
    document.body.appendChild(form)
    form.submit()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
