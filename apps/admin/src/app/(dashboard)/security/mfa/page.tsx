"use client"

import { useMutation } from "@tanstack/react-query"
import { FormEvent, useState } from "react"

import { Field, PageHeader, Panel } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate } from "@/lib/format"

type Challenge = { id: string; methods?: string[]; expires_at?: string }
type Assurance = { id: string; verified_at?: string; expires_at?: string }

export default function MfaPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [method, setMethod] = useState("totp")
  const [code, setCode] = useState("")
  const [assurance, setAssurance] = useState<Assurance | null>(null)
  const start = useMutation({ mutationFn: () => adminFetch<{ challenge: Challenge }>("/admin/security/mfa/challenges", { method: "POST" }), onSuccess: (response) => { setChallenge(response.challenge); setAssurance(null) } })
  const verify = useMutation({ mutationFn: () => adminFetch<{ assurance: Assurance }>(`/admin/security/mfa/challenges/${challenge?.id}/verify`, { method: "POST", body: { method, code } }), onSuccess: (response) => setAssurance(response.assurance) })
  const submit = (event: FormEvent) => { event.preventDefault(); verify.mutate() }
  return <div className="stack"><PageHeader eyebrow="Bảo mật" title="Xác minh MFA" description="Tạo phiên xác thực nâng cao trước khi thực hiện thao tác nhạy cảm hoặc xem audit log." /><div className="grid grid-2"><Panel title="Bước 1 · Tạo thử thách" description="Backend dùng factor MFA đã đăng ký cho tài khoản."><div className="panel-body form-stack"><button className="button" disabled={start.isPending} onClick={() => start.mutate()}>{start.isPending ? "Đang tạo..." : "Tạo thử thách MFA"}</button>{start.isError ? <div className="form-error">{start.error.message}</div> : null}{challenge ? <div className="form-success">Thử thách có hiệu lực đến {formatDate(challenge.expires_at)}.</div> : null}</div></Panel><Panel title="Bước 2 · Xác minh"><form className="panel-body form-stack" onSubmit={submit}><Field label="Phương thức"><select value={method} onChange={(event) => setMethod(event.target.value)} disabled={!challenge}><option value="totp">Ứng dụng TOTP</option><option value="recovery_code">Mã khôi phục</option></select></Field><Field label="Mã xác minh"><input autoComplete="one-time-code" disabled={!challenge} value={code} onChange={(event) => setCode(event.target.value.trim())} /></Field><button className="button" disabled={!challenge || !code || verify.isPending}>{verify.isPending ? "Đang xác minh..." : "Xác minh"}</button>{verify.isError ? <div className="form-error">{verify.error.message}</div> : null}{assurance ? <div className="form-success">Đã xác minh. Phiên step-up có hiệu lực đến {formatDate(assurance.expires_at)}.</div> : null}</form></Panel></div></div>
}
