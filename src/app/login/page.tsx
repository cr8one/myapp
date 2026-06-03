"use client"
import { useState, useEffect } from "react"

const MODULES = [
  { name: "DLMS", color: "#f97316" },
  { name: "SSSS", color: "#22c55e" },
  { name: "BPMS", color: "#3b82f6" },
  { name: "PRINSER", color: "#a855f7" },
  { name: "DPP", color: "#ec4899" },
  { name: "端末管理", color: "#06b6d4" },
]

export default function LoginPage() {
  const [csrfToken, setCsrfToken] = useState("")
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeModule, setActiveModule] = useState(0)

  useEffect(() => {
    fetch("/api/auth/csrf").then(r => r.json()).then(d => setCsrfToken(d.csrfToken))
    setTimeout(() => setMounted(true), 80)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error")) setError("メールアドレスまたはパスワードが正しくありません")
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveModule(i => (i + 1) % MODULES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  const activeColor = MODULES[activeModule].color

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -50px) scale(1.1); }
          66%       { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-30px, 40px) scale(1.05); }
          66%       { transform: translate(20px, -30px) scale(0.9); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(20px, 25px) scale(1.08); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(32px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes moduleIn {
          from { opacity: 0; transform: scale(0.8); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%       { transform: scale(1.4); opacity: 1; }
        }
        @keyframes barGlow {
          from { opacity: 0.3; transform: scaleX(0.3); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        .bg-animated {
          background: linear-gradient(-45deg, #0f0f1a, #1a0533, #0d1f3c, #1a0a00, #0a1a0a, #1a0020, #0d1f3c, #0f0f1a);
          background-size: 600% 600%;
          animation: gradientShift 16s ease infinite;
        }
        .blob-1 { animation: blob1 12s ease-in-out infinite; }
        .blob-2 { animation: blob2 15s ease-in-out infinite; }
        .blob-3 { animation: blob3 10s ease-in-out infinite; }
        .card-in { animation: cardIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .title-in { animation: titleIn 0.5s ease 0.3s both; }
        .module-in { animation: moduleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .dot-pulse { animation: dotPulse 1.8s ease-in-out infinite; }
        .bar-glow { animation: barGlow 0.4s ease forwards; }
      `}</style>

      {/* 背景 */}
      <div className="absolute inset-0 bg-animated" />

      {/* Blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob-1 absolute top-[-120px] left-[-120px] w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: `radial-gradient(circle, ${activeColor}55, transparent 70%)`, transition: "background 1s ease" }} />
        <div className="blob-2 absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${MODULES[(activeModule + 2) % MODULES.length].color}44, transparent 70%)`, transition: "background 1s ease" }} />
        <div className="blob-3 absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full opacity-15"
          style={{ background: `radial-gradient(circle, ${MODULES[(activeModule + 4) % MODULES.length].color}33, transparent 70%)`, transition: "background 1s ease" }} />
      </div>

      {/* カード */}
      <div className={`relative z-10 w-full max-w-sm mx-4 ${mounted ? "card-in" : "opacity-0"}`}>
        <div className="backdrop-blur-2xl bg-white bg-opacity-[0.07] border border-white border-opacity-10 rounded-3xl shadow-2xl px-8 py-10">

          {/* システム名 */}
          <div className={`text-center mb-7 ${mounted ? "title-in" : "opacity-0"}`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-white text-xl font-black tracking-tight">Japan Sleeve</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: activeColor, transition: "background 0.6s ease" }}>
                System
              </span>
            </div>
            <p className="text-white text-opacity-40 text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
              Business Management Platform
            </p>
          </div>

          {/* モジュールインジケーター */}
          <div className="mb-7">
            {/* バー */}
            <div className="flex gap-1 mb-3">
              {MODULES.map((m, i) => (
                <div key={m.name} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white bg-opacity-10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: m.color,
                      width: i === activeModule ? "100%" : "0%",
                      opacity: i === activeModule ? 1 : 0,
                    }}
                  />
                </div>
              ))}
            </div>
            {/* モジュール名 */}
            <div className="flex items-center justify-center gap-1.5">
              <div className="dot-pulse w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: activeColor, transition: "background 0.6s ease" }} />
              <span className="text-xs font-medium transition-all duration-300"
                style={{ color: activeColor }}>
                {MODULES[activeModule].name}
              </span>
            </div>
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
              <label htmlFor="email" className="block text-xs font-medium tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 text-sm rounded-xl border bg-white bg-opacity-5 text-white placeholder-white focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "rgba(255,255,255,0.12)",
                  "--tw-ring-color": activeColor,
                  caretColor: activeColor,
                } as React.CSSProperties}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm rounded-xl border bg-white bg-opacity-5 text-white placeholder-white focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: "rgba(255,255,255,0.12)",
                  "--tw-ring-color": activeColor,
                  caretColor: activeColor,
                } as React.CSSProperties}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border"
                style={{ background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.3)" }}>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="#fca5a5">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm" style={{ color: "#fca5a5" }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all mt-2 hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
              style={{ background: `linear-gradient(135deg, ${activeColor}, ${MODULES[(activeModule + 1) % MODULES.length].color})`, transition: "background 0.6s ease" }}
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
          <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.2)" }}>
            © 2026 Japan Sleeve Co., Ltd.
          </p>
        </div>
      </div>
    </div>
  )
}
