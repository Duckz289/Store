"use client"

import { FormEvent, useEffect, useState } from "react"
import { Mailbox } from "@medusajs/icons"

type RepairQuote = {
  id: string
  version: number
  status: string
  currency_code: string
  total: number
  valid_until: string | null
  decision: string | null
}

type RepairLookupResponse = {
  repair_case: {
    code: string
    status: string
    created_at: string
    public_summary: string | null
    device: {
      product_title: string | null
      brand: string | null
      model: string
    } | null
    quotes?: RepairQuote[]
  }
}

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const statusLabels: Record<string, string> = {
  intake: "Đã tiếp nhận",
  diagnosis: "Đang chẩn đoán",
  quote: "Đang lập báo giá",
  awaiting_customer_decision: "Chờ bạn xác nhận báo giá",
  repair: "Đang sửa chữa",
  quality_assurance: "Đang kiểm tra chất lượng",
  return_ready: "Sẵn sàng bàn giao",
  returned: "Đã bàn giao",
  closed: "Đã hoàn tất",
  canceled: "Đã hủy",
}

export default function RepairQuoteInbox() {
  const [savedReference, setSavedReference] = useState({ code: "", phone: "" })
  const [result, setResult] = useState<
    RepairLookupResponse["repair_case"] | null
  >(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("hp-last-repair") ?? "null")
      if (saved?.code && saved?.phone) {
        setSavedReference({ code: saved.code, phone: saved.phone })
      }
    } catch {}
  }, [])

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)
    const form = new FormData(event.currentTarget)
    const code = String(form.get("code") ?? "")
      .trim()
      .toUpperCase()
    const phone = String(form.get("phone") ?? "").trim()

    try {
      const response = await fetch(
        `${backendUrl}/store/repairs/${encodeURIComponent(code)}?phone=${encodeURIComponent(phone)}`,
        {
          headers: publishableKey
            ? { "x-publishable-api-key": publishableKey }
            : undefined,
        },
      )
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Không tìm thấy hồ sơ. Hãy kiểm tra lại mã và số điện thoại."
            : (payload.message ?? "Không thể tra cứu hồ sơ lúc này."),
        )
      }
      localStorage.setItem("hp-last-repair", JSON.stringify({ code, phone }))
      setSavedReference({ code, phone })
      setResult((payload as RepairLookupResponse).repair_case)
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Không thể tra cứu hồ sơ lúc này.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <form
        onSubmit={lookup}
        className="rounded-[var(--hp-radius-panel)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 shadow-sm sm:p-7"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-semibold text-[var(--hp-ink)]">
            Mã hồ sơ
            <input
              key={`code-${savedReference.code}`}
              name="code"
              defaultValue={savedReference.code}
              placeholder="Ví dụ: RP-123456"
              required
              className={inputClassName}
            />
          </label>
          <label className="text-sm font-semibold text-[var(--hp-ink)]">
            Số điện thoại
            <input
              key={`phone-${savedReference.phone}`}
              name="phone"
              type="tel"
              defaultValue={savedReference.phone}
              placeholder="09xxxxxxxx"
              required
              className={inputClassName}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-5 text-sm font-bold text-white hover:bg-[var(--hp-accent-strong)] disabled:opacity-60"
          >
            {loading ? "Đang tìm..." : "Tra cứu"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section className="overflow-hidden rounded-[var(--hp-radius-panel)] border border-[var(--hp-line)] bg-[var(--hp-surface)] shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--hp-line)] p-5 sm:p-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--hp-muted)]">
                {result.code}
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-[var(--hp-ink)]">
                {result.device?.product_title ??
                  result.device?.model ??
                  "Thiết bị sửa chữa"}
              </h2>
              {result.device?.brand && (
                <p className="mt-1 text-sm text-[var(--hp-muted)]">
                  {result.device.brand}
                </p>
              )}
            </div>
            <span className="rounded-full bg-[var(--hp-accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--hp-accent)]">
              {statusLabels[result.status] ?? result.status}
            </span>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <Mailbox className="h-5 w-5 text-[var(--hp-accent)]" />
              <h3 className="text-base font-bold text-[var(--hp-ink)]">
                Báo giá
              </h3>
            </div>
            {result.quotes?.length ? (
              <div className="mt-4 space-y-3">
                {result.quotes.map((quote) => (
                  <article
                    key={quote.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--hp-line)] p-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-[var(--hp-ink)]">
                        Báo giá lần {quote.version}
                      </p>
                      <p className="mt-1 text-xs text-[var(--hp-muted)]">
                        {quote.decision === "approved"
                          ? "Bạn đã đồng ý"
                          : quote.decision === "rejected"
                            ? "Bạn đã từ chối"
                            : quote.status === "submitted"
                              ? "Đang chờ xác nhận"
                              : "Đang được chuẩn bị"}
                      </p>
                    </div>
                    <strong className="text-lg text-[var(--hp-accent)]">
                      {formatMoney(quote.total, quote.currency_code)}
                    </strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-[var(--hp-paper)] px-4 py-5 text-sm leading-6 text-[var(--hp-muted)]">
                Chưa có báo giá mới. Kỹ thuật viên sẽ cập nhật sau khi kiểm tra
                thiết bị.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

const inputClassName =
  "mt-2 h-11 w-full rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-white px-3 text-sm font-medium text-[var(--hp-ink)] outline-none focus:border-[var(--hp-accent)] focus:ring-2 focus:ring-[var(--hp-accent-soft)]"

function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount)
}
