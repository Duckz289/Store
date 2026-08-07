"use client"

import { Plus } from "@medusajs/icons"
import { Button, Heading } from "@modules/common/components/ui"
import { useActionState, useEffect, useState } from "react"

import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"

const AddAddress = () => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  return (
    <>
      <button
        className="min-h-[220px] h-full w-full rounded-[var(--hp-radius-card)] border border-dashed border-[var(--hp-line)] p-5 text-left transition-colors hover:border-[var(--hp-accent)]"
        type="button"
        onClick={open}
        data-testid="add-address-button"
      >
        <span className="type-product-title">Thêm địa chỉ</span>
        <Plus />
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>
          <Heading className="mb-2">Thêm địa chỉ</Heading>
        </Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex flex-col gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
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
                label="Địa chỉ"
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />
              <Input
                label="Tòa nhà, căn hộ (không bắt buộc)"
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-2">
                <Input
                  label="Mã bưu chính (không bắt buộc)"
                  name="postal_code"
                  autoComplete="postal-code"
                  data-testid="postal-code-input"
                />
                <Input
                  label="Thành phố / quận huyện"
                  name="city"
                  required
                  autoComplete="locality"
                  data-testid="city-input"
                />
              </div>
              <Input
                label="Tỉnh / thành phố"
                name="province"
                required
                autoComplete="address-level1"
                data-testid="state-input"
              />
              <Input
                label="Số điện thoại (không bắt buộc)"
                name="phone"
                type="tel"
                autoComplete="tel"
                data-testid="phone-input"
              />
              <p className="type-product-spec text-[var(--hp-muted)]">
                Địa chỉ được lưu tại Việt Nam.
              </p>
              <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--hp-ink)]">
                <input type="checkbox" name="is_default_shipping" />
                Dùng làm địa chỉ giao hàng mặc định
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--hp-ink)]">
                <input type="checkbox" name="is_default_billing" />
                Dùng làm địa chỉ thanh toán mặc định
              </label>
            </div>
            {formState.error && (
              <div
                className="type-product-spec py-2 text-[var(--hp-danger)]"
                role="alert"
                data-testid="address-error"
              >
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10"
                data-testid="cancel-button"
              >
                Hủy
              </Button>
              <SubmitButton data-testid="save-button">Lưu địa chỉ</SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default AddAddress
