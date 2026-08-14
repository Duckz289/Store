"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { Field, PageHeader, Panel } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { RepairCase } from "@/lib/types"

export default function NewRepairPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", deviceType: "Điện thoại", brand: "", model: "", serial: "", condition: "", summary: "", sla: "" })
  const change = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }))
  const create = useMutation({ mutationFn: () => adminFetch<{ repair_case: RepairCase }>("/admin/repairs", { method: "POST", body: { idempotency_key: crypto.randomUUID(), contact: { full_name: form.fullName, phone: form.phone, email: form.email || null, consented_at: new Date().toISOString() }, device: { device_type: form.deviceType, brand: form.brand || null, model: form.model, serial_number: form.serial || null, condition_summary: form.condition }, public_summary: form.summary || null, sla_due_at: form.sla ? new Date(form.sla).toISOString() : null } }), onSuccess: (response) => router.push(`/repairs/${response.repair_case.id}`) })
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate() }
  return <div className="stack"><PageHeader eyebrow="Sửa chữa" title="Tiếp nhận thiết bị" description="Thông tin khách hàng và thiết bị được tạo qua workflow sửa chữa hiện có." /><form className="stack" onSubmit={submit}><Panel title="Khách hàng"><div className="panel-body form-grid"><Field label="Họ tên"><input required value={form.fullName} onChange={(event) => change("fullName", event.target.value)} /></Field><Field label="Số điện thoại"><input required value={form.phone} onChange={(event) => change("phone", event.target.value)} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(event) => change("email", event.target.value)} /></Field><Field label="SLA dự kiến"><input type="datetime-local" value={form.sla} onChange={(event) => change("sla", event.target.value)} /></Field></div></Panel><Panel title="Thiết bị"><div className="panel-body form-grid"><Field label="Loại thiết bị"><input required value={form.deviceType} onChange={(event) => change("deviceType", event.target.value)} /></Field><Field label="Thương hiệu"><input value={form.brand} onChange={(event) => change("brand", event.target.value)} /></Field><Field label="Model"><input required value={form.model} onChange={(event) => change("model", event.target.value)} /></Field><Field label="Serial / IMEI"><input value={form.serial} onChange={(event) => change("serial", event.target.value)} /></Field><Field label="Tình trạng tiếp nhận"><textarea required value={form.condition} onChange={(event) => change("condition", event.target.value)} /></Field><Field label="Tóm tắt cho khách"><textarea value={form.summary} onChange={(event) => change("summary", event.target.value)} /></Field></div></Panel>{create.isError ? <div className="form-error">{create.error.message}</div> : null}<div className="form-actions"><button type="button" className="button button-secondary" onClick={() => router.back()}>Hủy</button><button className="button" disabled={create.isPending}>{create.isPending ? "Đang tiếp nhận..." : "Tạo phiếu sửa chữa"}</button></div></form></div>
}
