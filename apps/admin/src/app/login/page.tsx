"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { sdk } from "@/lib/sdk"

type LoginMfaResponse = { mfa_required: true; token: string; mfa_challenge: { id: string; methods?: string[] } }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [challenge, setChallenge] = useState<LoginMfaResponse | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await sdk.auth.login("user", "emailpass", { email, password })
      if (typeof result === "object" && "mfa_required" in result) {
        setChallenge(result as LoginMfaResponse)
        return
      }
      if (typeof result !== "string") throw new Error("Phương thức đăng nhập này chưa được hỗ trợ.")
      router.replace("/dashboard")
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Đăng nhập không thành công.")
    } finally {
      setLoading(false)
    }
  }

  const verifyMfa = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge) return
    setLoading(true)
    setError("")
    try {
      await sdk.auth.mfa.verifyChallenge(challenge.mfa_challenge.id, { method: "totp", code })
      router.replace("/dashboard")
      router.refresh()
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Mã xác minh không hợp lệ.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="brand"><div className="brand-mark">HP</div><div><strong>Hưng Phát</strong><span>Vận hành</span></div></div>
        <div className="login-message"><p className="eyebrow">Trung tâm vận hành</p><h1>Mọi hoạt động cửa hàng, trong một nơi rõ ràng.</h1><p>Theo dõi đơn hàng, sản phẩm, sửa chữa và bảo mật bằng dữ liệu trực tiếp từ Medusa.</p></div>
        <p className="login-footnote">Custom Admin độc lập · Medusa API là nguồn sự thật</p>
      </section>
      <section className="login-form-panel">
        <div className="login-card">
          <p className="eyebrow">Đăng nhập an toàn</p>
          <h2>{challenge ? "Xác minh hai lớp" : "Chào mừng trở lại"}</h2>
          <p>{challenge ? "Nhập mã 6 số từ ứng dụng xác thực của bạn." : "Sử dụng tài khoản nhân viên đã được cấp quyền."}</p>
          {challenge ? (
            <form onSubmit={verifyMfa} className="form-stack">
              <label className="field"><span>Mã xác minh</span><input autoFocus inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" /></label>
              <button className="button button-block" disabled={loading || code.length !== 6}>{loading ? "Đang xác minh..." : "Xác minh và tiếp tục"}</button>
              <button type="button" className="text-button" onClick={() => { setChallenge(null); setCode("") }}>Quay lại đăng nhập</button>
            </form>
          ) : (
            <form onSubmit={login} className="form-stack">
              <label className="field"><span>Email</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@hungphat.vn" /></label>
              <label className="field"><span>Mật khẩu</span><input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" /></label>
              <button className="button button-block" disabled={loading}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</button>
            </form>
          )}
          {error ? <div className="form-error" role="alert">{error}</div> : null}
        </div>
      </section>
    </main>
  )
}
