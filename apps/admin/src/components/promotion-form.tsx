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
  const [method, setMethod] = useState(
    promotion?.application_method?.type ?? "percentage",
  )
  const [value, setValue] = useState(
    formatDiscountValue(
      promotion?.application_method?.value,
      promotion?.application_method?.type ?? "percentage",
    ),
  )
  const [startsAt, setStartsAt] = useState(
    toLocal(promotion?.campaign?.starts_at ?? promotion?.starts_at),
  )
  const [endsAt, setEndsAt] = useState(
    toLocal(promotion?.campaign?.ends_at ?? promotion?.ends_at),
  )

  const save = useMutation({
    mutationFn: async () => {
      const normalizedCode = code.trim().toUpperCase()
      const parsedAmount =
        method === "fixed" ? parseVndInput(value) : Number(value)
      const amount = parsedAmount ?? Number.NaN
      if (!normalizedCode) throw new Error("Nhập mã coupon.")
      if (
        !Number.isFinite(amount) ||
        amount < 0 ||
        (method === "percentage" && amount > 100)
      ) {
        throw new Error(
          method === "percentage"
            ? "Phần trăm phải từ 0 đến 100."
            : "Nhập số tiền hợp lệ.",
        )
      }

      const period = toCampaignPeriod(startsAt, endsAt)
      const body = {
        code: normalizedCode,
        type: "standard",
        status,
        application_method: {
          type: method,
          target_type: "items",
          allocation: "across",
          value: amount,
          currency_code: method === "fixed" ? "vnd" : undefined,
        },
      }

      if (!promotion) {
        const campaignId = period
          ? await createCampaign(normalizedCode, period)
          : undefined
        return adminFetch<{ promotion: Promotion }>("/admin/promotions", {
          method: "POST",
          body: { ...body, campaign_id: campaignId },
        })
      }

      if (period) await saveCampaignPeriod(promotion, normalizedCode, period)
      return adminFetch<{ promotion: Promotion }>(
        `/admin/promotions/${promotion.id}`,
        { method: "POST", body },
      )
    },
    onSuccess: (response) =>
      router.push(`/promotions/${response.promotion.id}`),
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate()
  }

  const changeMethod = (nextMethod: string) => {
    const currentAmount =
      method === "fixed" ? parseVndInput(value) : Number(value)
    setMethod(nextMethod)
    setValue(formatDiscountValue(currentAmount ?? undefined, nextMethod))
  }

  return (
    <form className="stack" onSubmit={submit}>
      <Panel
        title="Thiết lập chương trình"
        description="Nhập nhanh giá trị giảm và thời gian áp dụng. Thời gian được lưu trong Campaign của Medusa."
      >
        <div className="panel-body form-grid">
          <Field label="Mã coupon">
            <input
              required
              value={code}
              onChange={(event) =>
                setCode(event.target.value.toUpperCase().replace(/\s/g, ""))
              }
              placeholder="SALE10"
              autoCapitalize="characters"
            />
          </Field>
          <Field label="Trạng thái">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="draft">Bản nháp</option>
              <option value="active">Đang chạy</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </Field>
          <Field label="Cách giảm">
            <div className="segmented-choice">
              <button
                type="button"
                className={method === "percentage" ? "selected" : ""}
                onClick={() => changeMethod("percentage")}
              >
                Phần trăm
              </button>
              <button
                type="button"
                className={method === "fixed" ? "selected" : ""}
                onClick={() => changeMethod("fixed")}
              >
                Số tiền
              </button>
            </div>
          </Field>
          <Field label={method === "percentage" ? "Giảm giá" : "Số tiền giảm"}>
            {method === "percentage" ? (
              <div className="discount-control">
                <input
                  required
                  inputMode="decimal"
                  value={value}
                  onChange={(event) =>
                    setValue(event.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="10"
                />
                <span>%</span>
              </div>
            ) : (
              <VndDiscountInput value={value} onChange={setValue} />
            )}
          </Field>
          <Field label="Bắt đầu">
            <DateTimeInput
              value={startsAt}
              onChange={setStartsAt}
              onNow={() => setStartsAt(toLocal(new Date().toISOString()))}
            />
          </Field>
          <Field label="Kết thúc">
            <DateTimeInput
              value={endsAt}
              onChange={setEndsAt}
              onNow={() =>
                setEndsAt(
                  toLocal(
                    new Date(
                      Date.now() + 7 * 24 * 60 * 60 * 1000,
                    ).toISOString(),
                  ),
                )
              }
              nowLabel="+7 ngày"
            />
          </Field>
        </div>
      </Panel>
      {save.isError ? (
        <div className="form-error">{save.error.message}</div>
      ) : null}
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => router.back()}
        >
          Hủy
        </button>
        <button className="button" disabled={save.isPending}>
          {save.isPending ? "Đang lưu..." : "Lưu khuyến mãi"}
        </button>
      </div>
    </form>
  )
}

function VndDiscountInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="money-input">
      <div className="money-control">
        <span>₫</span>
        <input
          required
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(formatVndInput(event.target.value))}
          placeholder="0"
        />
      </div>
      <div className="money-shortcuts">
        <button
          type="button"
          onClick={() =>
            onChange(formatVndInput((parseVndInput(value) ?? 0) + 50_000))
          }
        >
          +50k
        </button>
        <button
          type="button"
          onClick={() =>
            onChange(formatVndInput((parseVndInput(value) ?? 0) + 100_000))
          }
        >
          +100k
        </button>
        <button
          type="button"
          onClick={() =>
            onChange(formatVndInput((parseVndInput(value) ?? 0) + 500_000))
          }
        >
          +500k
        </button>
      </div>
    </div>
  )
}

function DateTimeInput({
  value,
  onChange,
  onNow,
  nowLabel = "Ngay bây giờ",
}: {
  value: string
  onChange: (value: string) => void
  onNow: () => void
  nowLabel?: string
}) {
  return (
    <div className="datetime-input">
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={onNow}>
        {nowLabel}
      </button>
    </div>
  )
}

async function createCampaign(
  code: string,
  period: { starts_at?: string; ends_at?: string },
) {
  const { campaign } = await adminFetch<{ campaign: { id: string } }>(
    "/admin/campaigns",
    {
      method: "POST",
      body: {
        name: `Coupon ${code}`,
        campaign_identifier: `coupon-${code.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`,
        ...period,
      },
    },
  )
  return campaign.id
}

async function saveCampaignPeriod(
  promotion: Promotion,
  code: string,
  period: { starts_at?: string; ends_at?: string },
) {
  if (promotion.campaign?.id) {
    await adminFetch(`/admin/campaigns/${promotion.campaign.id}`, {
      method: "POST",
      body: period,
    })
    return
  }

  const campaignId = await createCampaign(code, period)
  await adminFetch(`/admin/campaigns/${campaignId}/promotions`, {
    method: "POST",
    body: { add: [promotion.id] },
  })
}

function toCampaignPeriod(startsAt: string, endsAt: string) {
  const starts_at = startsAt ? new Date(startsAt).toISOString() : undefined
  const ends_at = endsAt ? new Date(endsAt).toISOString() : undefined
  if (starts_at && ends_at && new Date(ends_at) <= new Date(starts_at))
    throw new Error("Thời điểm kết thúc phải sau thời điểm bắt đầu.")
  return starts_at || ends_at ? { starts_at, ends_at } : null
}

function toLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function formatDiscountValue(value: number | undefined, method: string) {
  if (value === undefined) return method === "percentage" ? "10" : ""
  return method === "fixed" ? formatVndInput(value) : String(value)
}

function formatVndInput(value: number | string) {
  const amount = parseVndInput(String(value))
  return amount === null
    ? ""
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(
        amount,
      )
}

function parseVndInput(value: string) {
  const digits = value.replace(/\D/g, "")
  if (!digits) return null
  const amount = Number(digits)
  return Number.isSafeInteger(amount) ? amount : null
}
