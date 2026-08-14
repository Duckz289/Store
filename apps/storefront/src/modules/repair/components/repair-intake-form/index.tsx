"use client"

import {
  ChangeEvent,
  FormEvent,
  InputHTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from "react"
import { CheckCircleSolid, Photo, Trash } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type UploadedRepairImage = {
  file_id: string
  file_reference: string
  mime_type: string
  size_bytes: number
  checksum: string
}

type RepairCreatedResponse = {
  repair_case: { code: string }
}

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const acceptedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]

export default function RepairIntakeForm() {
  const [images, setImages] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [createdCode, setCreatedCode] = useState("")

  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  )

  useEffect(
    () => () => imagePreviews.forEach(({ url }) => URL.revokeObjectURL(url)),
    [imagePreviews],
  )

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    setError("")
    const invalid = selected.find(
      (file) =>
        !acceptedImageTypes.includes(file.type) || file.size > 8 * 1024 * 1024,
    )
    if (invalid) {
      setError(
        "Mỗi ảnh phải là JPG, PNG, WEBP hoặc HEIC và không vượt quá 8 MB.",
      )
      event.target.value = ""
      return
    }
    if (images.length + selected.length > 5) {
      setError("Bạn có thể gửi tối đa 5 ảnh cho mỗi hồ sơ.")
    }
    setImages((current) => [...current, ...selected].slice(0, 5))
    event.target.value = ""
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setCreatedCode("")
    setSubmitting(true)

    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const phone = String(form.get("phone") ?? "").trim()
    const productName = String(form.get("product_name") ?? "").trim()
    const failedSince = String(form.get("failed_since") ?? "").trim()
    const issue = String(form.get("issue") ?? "").trim()

    try {
      const attachments: UploadedRepairImage[] = []
      for (const image of images) {
        attachments.push(await uploadRepairImage(image))
      }

      const response = await request<RepairCreatedResponse>("/store/repairs", {
        method: "POST",
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          contact: {
            full_name: String(form.get("full_name") ?? "").trim(),
            phone,
            email: String(form.get("email") ?? "").trim() || null,
            consented_at: new Date().toISOString(),
          },
          device: {
            device_type: String(form.get("device_type") ?? "").trim(),
            brand: String(form.get("brand") ?? "").trim() || null,
            model: productName,
            product_title: productName,
            condition_summary: failedSince
              ? `Bắt đầu gặp lỗi từ ${failedSince}. ${issue}`
              : issue,
          },
          public_summary: issue,
          attachments,
        }),
      })

      localStorage.setItem(
        "hp-last-repair",
        JSON.stringify({ code: response.repair_case.code, phone }),
      )
      setCreatedCode(response.repair_case.code)
      setImages([])
      formElement.reset()
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Không thể gửi hồ sơ. Vui lòng thử lại.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (createdCode) {
    return (
      <section className="rounded-[var(--hp-radius-panel)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-6 shadow-sm sm:p-8">
        <CheckCircleSolid className="h-8 w-8 text-emerald-600" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
          Đã tiếp nhận
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[var(--hp-ink)]">
          Mã hồ sơ: {createdCode}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--hp-muted)]">
          Hãy lưu mã này. Khi có chẩn đoán hoặc báo giá, bạn xem tại Hòm báo
          giá.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedClientLink
            href="/repair/inbox"
            className="inline-flex h-11 items-center rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-5 text-sm font-bold text-white hover:bg-[var(--hp-accent-strong)]"
          >
            Mở Hòm báo giá
          </LocalizedClientLink>
          <button
            type="button"
            onClick={() => setCreatedCode("")}
            className="h-11 rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] px-5 text-sm font-bold text-[var(--hp-ink)]"
          >
            Gửi hồ sơ khác
          </button>
        </div>
      </section>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--hp-radius-panel)] border border-[var(--hp-line)] bg-[var(--hp-surface)] shadow-sm"
    >
      <div className="border-b border-[var(--hp-line)] px-5 py-5 sm:px-7">
        <h2 className="text-xl font-extrabold tracking-[-0.025em] text-[var(--hp-ink)]">
          Thông tin tiếp nhận
        </h2>
        <p className="mt-1 text-sm text-[var(--hp-muted)]">
          Các mục có dấu * là bắt buộc.
        </p>
      </div>

      <div className="space-y-7 p-5 sm:p-7">
        <fieldset>
          <legend className="mb-4 text-sm font-bold text-[var(--hp-ink)]">
            Thiết bị
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tên sản phẩm *"
              name="product_name"
              placeholder="Ví dụ: iPhone 15 Pro"
              required
            />
            <Field
              label="Hãng (không bắt buộc)"
              name="brand"
              placeholder="Apple, Samsung..."
            />
            <label className="block text-sm font-semibold text-[var(--hp-ink)]">
              Loại thiết bị *
              <select
                name="device_type"
                required
                className={inputClassName}
                defaultValue=""
              >
                <option value="" disabled>
                  Chọn loại thiết bị
                </option>
                <option value="Điện thoại">Điện thoại</option>
                <option value="Laptop">Laptop</option>
                <option value="Máy tính bảng">Máy tính bảng</option>
                <option value="Tai nghe / phụ kiện">Tai nghe / phụ kiện</option>
                <option value="Thiết bị khác">Thiết bị khác</option>
              </select>
            </label>
            <Field label="Hư từ khi nào" name="failed_since" type="date" />
            <label className="block text-sm font-semibold text-[var(--hp-ink)] sm:col-span-2">
              Lỗi hoặc tình trạng đang gặp *
              <textarea
                name="issue"
                required
                rows={4}
                maxLength={2000}
                placeholder="Mô tả biểu hiện, tần suất và việc bạn đã thử xử lý..."
                className={`${inputClassName} min-h-28 resize-y py-3`}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="border-t border-[var(--hp-line)] pt-7">
          <legend className="mb-4 text-sm font-bold text-[var(--hp-ink)]">
            Hình ảnh thiết bị
          </legend>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[var(--hp-radius-control)] border border-dashed border-[var(--hp-line-strong)] bg-[var(--hp-paper)] px-4 text-center hover:border-[var(--hp-accent)]">
            <Photo className="h-6 w-6 text-[var(--hp-accent)]" />
            <span className="mt-2 text-sm font-bold text-[var(--hp-ink)]">
              Chọn ảnh từ máy
            </span>
            <span className="mt-1 text-xs text-[var(--hp-muted)]">
              Tối đa 5 ảnh, mỗi ảnh 8 MB
            </span>
            <input
              type="file"
              accept={acceptedImageTypes.join(",")}
              multiple
              onChange={addImages}
              className="sr-only"
            />
          </label>
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {imagePreviews.map(({ file, url }, index) => (
                <div
                  key={`${file.name}-${file.lastModified}`}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--hp-line)] bg-[var(--hp-paper)]"
                >
                  {/* Blob URLs are local previews and cannot use Next Image optimization. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Ảnh thiết bị ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    aria-label={`Xóa ảnh ${index + 1}`}
                    className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white text-[var(--hp-ink)] shadow"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="border-t border-[var(--hp-line)] pt-7">
          <legend className="mb-4 text-sm font-bold text-[var(--hp-ink)]">
            Thông tin nhận báo giá
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Họ và tên *"
              name="full_name"
              autoComplete="name"
              required
            />
            <Field
              label="Số điện thoại *"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="09xxxxxxxx"
              required
            />
            <div className="sm:col-span-2">
              <Field
                label="Email (không bắt buộc)"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ban@email.com"
              />
            </div>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm leading-5 text-[var(--hp-muted)]">
            <input
              type="checkbox"
              required
              className="mt-0.5 h-4 w-4 accent-[var(--hp-accent)]"
            />
            Tôi đồng ý để cửa hàng dùng thông tin trên nhằm tiếp nhận và liên hệ
            về hồ sơ sửa chữa.
          </label>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="h-12 w-full rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-5 text-sm font-bold text-white hover:bg-[var(--hp-accent-strong)] disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? "Đang gửi hồ sơ..." : "Gửi yêu cầu sửa chữa"}
        </button>
      </div>
    </form>
  )
}

const inputClassName =
  "mt-2 h-11 w-full rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-white px-3 text-sm font-medium text-[var(--hp-ink)] outline-none transition focus:border-[var(--hp-accent)] focus:ring-2 focus:ring-[var(--hp-accent-soft)]"

function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold text-[var(--hp-ink)]">
      {label}
      <input {...props} className={inputClassName} />
    </label>
  )
}

async function uploadRepairImage(file: File): Promise<UploadedRepairImage> {
  const content = await fileToBase64(file)
  const response = await request<{ file: UploadedRepairImage }>(
    "/store/repair-uploads",
    {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        mime_type: file.type,
        content,
      }),
    },
  )
  return response.file
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "")
    reader.onerror = () => reject(new Error(`Không thể đọc ảnh ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
      ...init.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      payload.message ?? "Không thể kết nối đến hệ thống sửa chữa.",
    )
  }
  return payload as T
}
