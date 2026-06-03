"use client"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [csrfToken, setCsrfToken] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error")) {
      setError("メールアドレスまたはパスワードが正しくありません")
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* 左パネル */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #3b82f6 100%)" }}>
        {/* 背景装飾 */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full bg-white" />
          <div className="absolute bottom-[-60px] right-[-60px] w-72 h-72 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white" />
        </div>
        {/* ロゴ・テキスト */}
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center shadow-lg backdrop-blur-sm border border-white border-opacity-30">
              <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none">
                <rect x="4" y="8" width="32" height="8" rx="2" fill="white" fillOpacity="0.9"/>
                <rect x="8" y="18" width="24" height="6" rx="1" fill="white" fillOpacity="0.7"/>
                <rect x="12" y="26" width="16" height="4" rx="1" fill="white" fillOpacity="0.5"/>
                <circle cx="20" cy="34" r="2" fill="white" fillOpacity="0.8"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">
            Japan Sleeve System
          </h1>
          <p className="text-blue-200 text-sm font-medium tracking-widest uppercase mb-8">
            Business Management Platform
          </p>
          <div className="flex flex-col gap-3 text-left">
            {["抜き型・図面管理 (DLMS)", "サンプルシール支給管理 (SSSS)", "新規開発管理 (BPMS)", "端末管理・マスタ管理"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300 flex-shrink-0" />
                <span className="text-blue-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        {/* フッター */}
        <p className="absolute bottom-6 text-blue-300 text-xs opacity-60">
          © 2026 Japan Sleeve Co., Ltd.
        </p>
      </div>

      {/* 右パネル（フォーム） */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        {/* モバイル用ロゴ */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow"
            style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}>
            <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
              <rect x="4" y="8" width="32" height="8" rx="2" fill="white" fillOpacity="0.9"/>
              <rect x="8" y="18" width="24" height="6" rx="1" fill="white" fillOpacity="0.7"/>
              <rect x="12" y="26" width="16" height="4" rx="1" fill="white" fillOpacity="0.5"/>
              <circle cx="20" cy="34" r="2" fill="white" fillOpacity="0.8"/>
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-900">Japan Sleeve System</h1>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">おかえりなさい</h2>
            <p className="text-sm text-gray-500">アカウント情報を入力してください</p>
          </div>

          <form method="POST" action="/api/auth/callback/credentials" className="space-y-5">
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value="/dashboard" />

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="example@japan-sleeve.co.jp"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
