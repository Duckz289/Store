"use client"

import { addCustomerAddress } from "@lib/data/customer"
import { Heading } from "@modules/common/components/ui"
import { useActionState } from "react"

import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import VietnamAddressFields from "./vietnam-address-fields"

const AddAddress = () => {
  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  return (
    <form
      action={formAction}
      className="rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-paper)] p-5 sm:p-6"
      data-testid="add-address-form"
    >
      <div className="mb-5">
        <Heading level="h2" className="type-product-title text-lg">
          Thêm địa chỉ
        </Heading>
        <p className="type-product-spec mt-1 text-[var(--hp-muted)]">
          Nhập địa chỉ giao hàng để dùng nhanh khi thanh toán.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Tên"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            label="Họ"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
        </div>
        <Input
          label="Công ty (không bắt buộc)"
          name="company"
          autoComplete="organization"
          data-testid="company-input"
        />
        <Input
          label="Địa chỉ chi tiết"
          name="address_1"
          required
          autoComplete="street-address"
          data-testid="address-1-input"
        />
        <Input
          label="Tòa nhà, căn hộ (không bắt buộc)"
          name="address_2"
          autoComplete="address-line2"
          data-testid="address-2-input"
        />
        <VietnamAddressFields />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Mã bưu chính (không bắt buộc)"
            name="postal_code"
            autoComplete="postal-code"
            data-testid="postal-code-input"
          />
          <Input
            label="Số điện thoại (không bắt buộc)"
            name="phone"
            type="tel"
            autoComplete="tel"
            data-testid="phone-input"
          />
        </div>
      </div>

      <p className="type-product-spec mt-4 text-[var(--hp-muted)]">
        Chỉ lưu địa chỉ tại Việt Nam.
      </p>

      <div className="mt-4 grid gap-2 text-sm text-[var(--hp-ink)]">
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            id="add-default-shipping"
            name="is_default_shipping"
            className="h-4 w-4 rounded border-gray-300 accent-[var(--hp-accent)]"
          />
          <span>Dùng làm địa chỉ giao hàng mặc định</span>
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            id="add-default-billing"
            name="is_default_billing"
            className="h-4 w-4 rounded border-gray-300 accent-[var(--hp-accent)]"
          />
          <span>Dùng làm địa chỉ thanh toán mặc định</span>
        </label>
      </div>

      {formState.error && (
        <div
          className="type-product-spec mt-3 text-[var(--hp-danger)]"
          role="alert"
          data-testid="address-error"
        >
          {formState.error}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <SubmitButton data-testid="save-button">Lưu địa chỉ</SubmitButton>
      </div>
    </form>
  )
}

export default AddAddress
