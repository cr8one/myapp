"use client"
import { useState, useEffect, useRef } from "react"
import * as THREE from "three"

export default function LoginPage() {
  const [csrfToken, setCsrfToken] = useState("")
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const scatteringRef = useRef(false) // 散る効果の管理
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)
  const formRef = useRef<HTMLFormElement>(null) // フォームの参照を追加

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then(r => r.json())
      .then(d => setCsrfToken(d.csrfToken))
    const params = new URLSearchParams(window.location.search)
    if (params.get("error"))
      setError("メールアドレスまたはパスワードが正しくありません")
    setTimeout(() => setMounted(true), 150)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0xf7f8fa, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.z = 6

    type OrbitalParticle = {
      mesh: THREE.Mesh
      orbitA: number
      orbitB: number
      speed: number
      phase: number
      tiltX: number
      tiltZ: number
      centerX: number
      centerY: number
    }

    const particles: OrbitalParticle[] = []
    const particleGeo = new THREE.SphereGeometry(0.022, 8, 8)

    // CMYKカラー（薄め）
    const cmykColors = [
      0x7fd4e0,
      0xe87fb0,
      0xf0d060,
      0x909090,
      0xb0c8d8,
      0xd8b0c8,
    ]

    for (let i = 0; i < 130; i++) {
      const color = cmykColors[Math.floor(Math.random() * cmykColors.length)]
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: Math.random() * 0.45 + 0.15,
      })
      const mesh = new THREE.Mesh(particleGeo, mat)
      scene.add(mesh)

      particles.push({
        mesh,
        orbitA: Math.random() * 3.5 + 1.2,
        orbitB: Math.random() * 2.2 + 0.7,
        speed: (Math.random() * 0.003 + 0.0008) * (Math.random() > 0.5 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        tiltX: (Math.random() - 0.5) * Math.PI,
        tiltZ: (Math.random() - 0.5) * Math.PI * 0.5,
        centerX: (Math.random() - 0.5) * 2.5,
        centerY: (Math.random() - 0.5) * 2,
      })
    }

    // 薄いグリッド線の描画
    const gridMat = new THREE.LineBasicMaterial({
      color: 0xe0e8f0,
      transparent: true,
      opacity: 0.5,
    })
    for (let i = -6; i <= 6; i++) {
      const hGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-9, i * 0.75, -2),
        new THREE.Vector3(9, i * 0.75, -2),
      ])
      scene.add(new THREE.Line(hGeo, gridMat))
      const vGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(i * 1.2, -6, -2),
        new THREE.Vector3(i * 1.2, 6, -2),
      ])
      scene.add(new THREE.Line(vGeo, gridMat))
    }

    const mouse = { x: 0, y: 0 }
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 1.5
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 1.5
    }
    window.addEventListener("mousemove", handleMouseMove)

    let t = 0
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      t += 1

      // パーティクルの座標更新
      for (const p of particles) {
        const angle = p.phase + t * p.speed
        if (scatteringRef.current) {
          // エフェクトをより顕著にするため増加量を拡大
          p.orbitA += 0.02
          p.orbitB += 0.02
        }
        const x = p.centerX + Math.cos(angle) * p.orbitA
        const y = p.centerY + Math.sin(angle) * p.orbitB
        const cosX = Math.cos(p.tiltX)
        const sinX = Math.sin(p.tiltX)
        const cosZ = Math.cos(p.tiltZ)
        const sinZ = Math.sin(p.tiltZ)
        p.mesh.position.x = x * cosZ - y * sinZ * cosX
        p.mesh.position.y = x * sinZ + y * cosZ * cosX
        p.mesh.position.z = y * sinX - 1
      }

      camera.position.x += (mouse.x - camera.position.x) * 0.05
      camera.position.y += (-mouse.y - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)
      renderer.dispose()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .form-in {
          animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .input-field {
          width: 100%;
          padding: 10px 14px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #1a2640;
          font-size: 0.875rem;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .input-field::placeholder { color: #c0ccd8; }
        .input-field:focus {
          border-color: #93b4d4;
          box-shadow: 0 0 0 3px rgba(100,160,220,0.1);
        }
        .submit-btn {
          width: 100%;
          padding: 11px;
          background: #1e3a5f;
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .submit-btn:hover { background: #16304f; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Three.js の描画キャンバス */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />

      {/* 中央グロー */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.75) 0%, transparent 65%)",
        }}
      />

      {/* ログインカード */}
      <div
        className={`relative ${mounted ? "form-in" : "opacity-0"}`}
        style={{ zIndex: 10, width: "100%", maxWidth: "400px", padding: "0 16px" }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.93)",
            border: "1px solid rgba(200,215,230,0.7)",
            borderRadius: "18px",
            padding: "44px 44px 36px",
            boxShadow:
              "0 8px 40px rgba(80,120,160,0.10), 0 1px 4px rgba(80,120,160,0.06)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* タイトル */}
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "1.5rem",
                fontWeight: 400,
                color: "#0f1e35",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                marginBottom: 8,
              }}
            >
              Japan Sleeve System
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 300,
                color: "#8a9ab0",
                letterSpacing: "0.06em",
              }}
            >
              Sign in to continue
            </p>
          </div>

          {/* アクセントライン */}
          <div style={{ height: 1, background: "#e8eef4", marginBottom: 28 }} />

          {/* ログインフォーム */}
          <form
            ref={formRef}
            method="POST"
            action="/api/auth/callback/credentials"
            onSubmit={(e) => {
              // 散るエフェクトのため一旦送信をキャンセルし、後から送信する
              e.preventDefault()
              setLoading(true)
              scatteringRef.current = true
              // エフェクトを十分に見せるために、1.5秒後にフォーム送信を実施
              setTimeout(() => {
                // プログラム的に送信
                if (formRef.current) formRef.current.submit()
              }, 1500)
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value="/dashboard" />

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 500,
                  color: "#7a8a9a",
                  marginBottom: 6,
                  letterSpacing: "0.06em",
                }}
              >
                EMAIL
              </label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="your@email.com"
                className="input-field"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 500,
                  color: "#7a8a9a",
                  marginBottom: 6,
                  letterSpacing: "0.06em",
                }}
              >
                PASSWORD
              </label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input-field"
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "9px 12px",
                  background: "#fff5f5",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  color: "#ef4444",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
              style={{ marginTop: 6 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              textAlign: "center",
              fontSize: "0.6rem",
              color: "#c8d4e0",
              marginTop: 24,
              letterSpacing: "0.04em",
            }}
          >
            © 2026 Japan Sleeve Co., Ltd.
          </p>
        </div>
      </div>
    </div>
  )
}
