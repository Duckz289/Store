"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { sdk } from "@/lib/sdk"

type LoginMfaResponse = {
  mfa_required: true
  token: string
  mfa_challenge: { id: string; methods?: string[] }
}

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
      if (typeof result !== "string") throw new Error("Unable to sign in.")
      router.replace("/dashboard")
      router.refresh()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.")
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
      setError(verifyError instanceof Error ? verifyError.message : "Invalid code.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-form-panel">
        <div className="login-card login-card-compact">
          {challenge ? (
            <form onSubmit={verifyMfa} className="form-stack">
              <label className="sr-only" htmlFor="mfa-code">Code</label>
              <input id="mfa-code" autoFocus inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="Code" />
              <button className="button button-block" disabled={loading || code.length !== 6}>{loading ? "..." : "Continue"}</button>
              <button type="button" className="text-button" onClick={() => { setChallenge(null); setCode("") }}>Back</button>
            </form>
          ) : (
            <form onSubmit={login} className="form-stack">
              <label className="sr-only" htmlFor="login-account">Account</label>
              <input id="login-account" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Account" />
              <label className="sr-only" htmlFor="login-password">Password</label>
              <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
              <button className="button button-block" disabled={loading}>{loading ? "..." : "Login"}</button>
            </form>
          )}
          {error ? <div className="form-error" role="alert">{error}</div> : null}
        </div>
      </section>
    </main>
  )
}
