"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { Field, PageHeader, Panel } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { RepairCase } from "@/lib/types"

const commonIssues = ["Không lên nguồn", "Vỡ màn hình", "Pin yếu", "Vào nước"]

export default function NewRepairPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    deviceType: "Điện thoại",
    brand: "",
    model: "",
    serial: "",
    condition: "",
    summary: "",
    sla: "",
  })
  const change = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const create = useMutation({
    mutationFn: () =>
      adminFetch<{ repair_case: RepairCase }>("/admin/repairs", {
        method: "POST",
        body: {
          idempotency_key: crypto.randomUUID(),
          contact: {
            full_name: form.fullName,
            phone: form.phone,
            email: form.email || null,
            consented_at: new Date().toISOString(),
          },
          device: {
            device_type: form.deviceType,
            brand: form.brand || null,
            model: form.model,
            serial_number: form.serial || null,
            condition_summary: form.condition,
          },
          public_summary: form.summary || form.condition,
          sla_due_at: form.sla ? new Date(form.sla).toISOString() : null,
        },
      }),
    onSuccess: (response) => router.push(`/repairs/${response.repair_case.id}`),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate()
  }

  const setSlaAfter = (hours: number) => {
    const due = new Date(Date.now() + hours * 60 * 60 * 1000)
    const offset = due.getTimezoneOffset() * 60_000
    change("sla", new Date(due.getTime() - offset).toISOString().slice(0, 16))
  }

  const addIssue = (issue: string) => {
    if (form.condition.includes(issue)) return
    change(
      "condition",
      [form.condition.trim(), issue].filter(Boolean).join("; "),
    )
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Sửa chữa"
        title="Tiếp nhận thiết bị"
        description="Nhập nhanh tại quầy; hồ sơ được tạo qua workflow sửa chữa hiện có."
      />
      <form className="stack" onSubmit={submit}>
        <Panel
          title="Khách hàng"
          description="Thông tin dùng để liên hệ và tra cứu hồ sơ."
        >
          <div className="panel-body form-grid">
            <Field label="Họ tên">
              <input
                required
                autoComplete="name"
                value={form.fullName}
                onChange={(event) => change("fullName", event.target.value)}
              />
            </Field>
            <Field label="Số điện thoại">
              <input
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => change("phone", event.target.value)}
                placeholder="09xxxxxxxx"
              />
            </Field>
            <Field label="Email (không bắt buộc)">
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => change("email", event.target.value)}
                placeholder="khach@email.com"
              />
            </Field>
            <Field label="SLA dự kiến">
              <div className="datetime-input">
                <input
                  type="datetime-local"
                  value={form.sla}
                  onChange={(event) => change("sla", event.target.value)}
                />
                <div className="datetime-shortcuts">
                  <button type="button" onClick={() => setSlaAfter(24)}>
                    +24 giờ
                  </button>
                  <button type="button" onClick={() => setSlaAfter(72)}>
                    +3 ngày
                  </button>
                </div>
              </div>
            </Field>
          </div>
        </Panel>

        <Panel
          title="Thiết bị"
          description="Chọn loại trước, sau đó ghi nhận model và tình trạng thực tế."
        >
          <div className="panel-body form-grid">
            <Field label="Loại thiết bị">
              <select
                required
                value={form.deviceType}
                onChange={(event) => change("deviceType", event.target.value)}
              >
                <option>Điện thoại</option>
                <option>Laptop</option>
                <option>Máy tính bảng</option>
                <option>Phụ kiện</option>
                <option>Thiết bị khác</option>
              </select>
            </Field>
            <Field label="Thương hiệu (không bắt buộc)">
              <input
                value={form.brand}
                onChange={(event) => change("brand", event.target.value)}
                placeholder="Apple, Samsung..."
              />
            </Field>
            <Field label="Tên sản phẩm / Model">
              <input
                required
                value={form.model}
                onChange={(event) => change("model", event.target.value)}
                placeholder="Ví dụ: iPhone 15 Pro"
              />
            </Field>
            <Field label="Serial / IMEI">
              <input
                value={form.serial}
                onChange={(event) => change("serial", event.target.value)}
              />
            </Field>
            <Field label="Tình trạng tiếp nhận">
              <textarea
                required
                value={form.condition}
                onChange={(event) => change("condition", event.target.value)}
                placeholder="Mô tả biểu hiện và ngoại quan..."
              />
              <div className="money-shortcuts">
                {commonIssues.map((issue) => (
                  <button
                    key={issue}
                    type="button"
                    onClick={() => addIssue(issue)}
                  >
                    + {issue}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Ghi chú hiển thị cho khách">
              <textarea
                value={form.summary}
                onChange={(event) => change("summary", event.target.value)}
                placeholder="Bỏ trống để dùng tình trạng tiếp nhận"
              />
            </Field>
          </div>
        </Panel>

        {create.isError ? (
          <div className="form-error">{create.error.message}</div>
        ) : null}
        <div className="form-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={() => router.back()}
          >
            Hủy
          </button>
          <button className="button" disabled={create.isPending}>
            {create.isPending ? "Đang tiếp nhận..." : "Tạo phiếu sửa chữa"}
          </button>
        </div>
      </form>
    </div>
  )
}
