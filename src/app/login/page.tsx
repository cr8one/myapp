"use client"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [csrfToken, setCsrfToken] = useState("")
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
    setTimeout(() => setMounted(true), 100)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error")) {
      setError("メールアドレスまたはパスワードが正しくありません")
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* アニメーション背景 */}
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, -40px) scale(1.1); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(15px, 20px) scale(1.05); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.7) rotate(-10deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes loginSuccess {
          0%   { transform: scale(1); }
          30%  { transform: scale(0.96); }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1); opacity: 0.7; }
        }
        .bg-animated {
          background: linear-gradient(-45deg, #0f172a, #1e3a5f, #1d4ed8, #0369a1, #1e3a5f, #0f172a);
          background-size: 400% 400%;
          animation: gradientShift 12s ease infinite;
        }
        .blob1 { animation: float1 8s ease-in-out infinite; }
        .blob2 { animation: float2 10s ease-in-out infinite; }
        .blob3 { animation: float3 7s ease-in-out infinite; }
        .card-in { animation: cardIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .logo-in { animation: logoIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both; }
        .login-success { animation: loginSuccess 0.4s ease forwards; }
        .ring-spin { animation: spinSlow 3s linear infinite; }
      `}</style>

      {/* 背景 */}
      <div className="absolute inset-0 bg-animated" />

      {/* Blob装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob1 absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
        <div className="blob2 absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }} />
        <div className="blob3 absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1, transparent)" }} />
      </div>

      {/* カード */}
      <div
        className={`relative z-10 w-full max-w-sm mx-4 ${mounted ? "card-in" : "opacity-0"}`}
      >
        <div className="backdrop-blur-xl bg-white bg-opacity-10 border border-white border-opacity-20 rounded-3xl shadow-2xl px-8 py-10">

          {/* アイコン */}
          <div className={`flex justify-center mb-6 ${mounted ? "logo-in" : "opacity-0"}`}>
            <div className="relative">
              {/* 外側リング */}
              <div className="absolute inset-[-6px] rounded-2xl border-2 border-blue-400 border-opacity-40 ring-spin" />
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)" }}>
                <svg viewBox="0 0 32 32" className="w-9 h-9" fill="none">
                  {/* JSS アイコン：スリーブ（包装）をイメージした形 */}
                  <rect x="4" y="6" width="24" height="20" rx="3" stroke="white" strokeWidth="1.5" fill="white" fillOpacity="0.15"/>
                  <path d="M4 11 Q16 15 28 11" stroke="white" strokeWidth="1.5" fill="none"/>
                  <path d="M4 21 Q16 17 28 21" stroke="white" strokeWidth="1.5" fill="none"/>
                  <circle cx="16" cy="16" r="3" fill="white" fillOpacity="0.8"/>
                  <line x1="16" y1="6" x2="16" y2="26" stroke="white" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="2 2"/>
                </svg>
              </div>
            </div>
          </div>

          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-white tracking-tight mb-1">Japan Sleeve System</h1>
            <p className="text-blue-200 text-xs tracking-widest uppercase opacity-70">Sign in to continue</p>
          </div>

          {/* フォーム */}
          <form
            method="POST"
            action="/api/auth/callback/credentials"
            className="space-y-4"
            onSubmit={() => setLoading(true)}
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value="/dashboard" />

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-blue-100 tracking-wide uppercase">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 text-sm rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-blue-300 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-60 focus:border-transparent backdrop-blur-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-blue-100 tracking-wide uppercase">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm rounded-xl border border-white border-opacity-20 bg-white bg-opacity-10 text-white placeholder-blue-300 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-60 focus:border-transparent backdrop-blur-sm transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-xl">
                <svg className="w-4 h-4 text-red-300 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-sm font-semibold text-white rounded-xl shadow-lg transition-all mt-2 ${loading ? "login-success" : "hover:opacity-90 active:scale-[0.98]"}`}
              style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          {/* フッター */}
          <p className="text-center text-blue-300 text-xs mt-8 opacity-50">
            © 2026 Japan Sleeve Co., Ltd.
          </p>
        </div>
      </div>
    </div>
  )
}
