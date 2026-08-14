"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { Field, Panel } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { Promotion } from "@/lib/types"

export function PromotionForm({ promotion }: { promotion?: Promotion }) {
  const router = useRouter()
  const [code, setCode] = useState(promotion?.code ?? "")
  const [status, setStatus] = useState(promotion?.status ?? "draft")
  const [method, setMethod] = useState(promotion?.application_method?.type ?? "percentage")
  const [value, setValue] = useState(String(promotion?.application_method?.value ?? 10))
  const [startsAt, setStartsAt] = useState(toLocal(promotion?.starts_at))
  const [endsAt, setEndsAt] = useState(toLocal(promotion?.ends_at))
  const save = useMutation({ mutationFn: async () => {
    const body = { code: code.trim().toUpperCase(), type: "standard", status, starts_at: startsAt ? new Date(startsAt).toISOString() : null, ends_at: endsAt ? new Date(endsAt).toISOString() : null, application_method: { type: method, target_type: "items", allocation: "across", value: Number(value), currency_code: method === "fixed" ? "vnd" : undefined } }
    return promotion ? adminFetch<{ promotion: Promotion }>(`/admin/promotions/${promotion.id}`, { method: "POST", body }) : adminFetch<{ promotion: Promotion }>("/admin/promotions", { method: "POST", body })
  }, onSuccess: (response) => router.push(`/promotions/${response.promotion.id}`) })
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate() }
  return <form className="stack" onSubmit={submit}><Panel title="Thiết lập chương trình" description="Coupon áp dụng cho toàn bộ mặt hàng; có thể mở rộng điều kiện bằng Medusa Admin API."><div className="panel-body form-grid">
    <Field label="Mã coupon"><input required value={code} onChange={(event) => setCode(event.target.value)} placeholder="SALE10" /></Field>
    <Field label="Trạng thái"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">Bản nháp</option><option value="active">Đang chạy</option><option value="inactive">Tạm dừng</option></select></Field>
    <Field label="Cách giảm"><select value={method} onChange={(event) => setMethod(event.target.value)}><option value="percentage">Phần trăm</option><option value="fixed">Số tiền cố định</option></select></Field>
    <Field label={method === "percentage" ? "Phần trăm (%)" : "Số tiền (VND)"}><input required min="0" type="number" value={value} onChange={(event) => setValue(event.target.value)} /></Field>
    <Field label="Bắt đầu"><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></Field>
    <Field label="Kết thúc"><input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></Field>
  </div></Panel>{save.isError ? <div className="form-error">{save.error.message}</div> : null}<div className="form-actions"><button type="button" className="button button-secondary" onClick={() => router.back()}>Hủy</button><button className="button" disabled={save.isPending}>{save.isPending ? "Đang lưu..." : "Lưu khuyến mãi"}</button></div></form>
}

function toLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
