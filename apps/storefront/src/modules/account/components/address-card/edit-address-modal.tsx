"use client"

import { deleteCustomerAddress, updateCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { PencilSquare as Edit, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import { Button, Heading, Text, clx } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { useActionState, useEffect, useState } from "react"

import VietnamAddressFields from "./vietnam-address-fields"

type EditAddressProps = {
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

const EditAddress = ({ address, isActive = false }: EditAddressProps) => {
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)
  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  useEffect(() => {
    if (successState) {
      setSuccessState(false)
      closeModal()
    }
  }, [closeModal, successState])

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
  }

  return (
    <>
      <div
        className={clx(
          "flex min-h-[220px] h-full w-full flex-col justify-between rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] p-5 transition-colors",
          { "border-[var(--hp-accent)]": isActive }
        )}
        data-testid="address-container"
      >
        <div>
          <Heading className="text-left text-base-semi" data-testid="address-name">
            {address.first_name} {address.last_name}
          </Heading>
          {address.company && (
            <Text className="txt-compact-small text-ui-fg-base" data-testid="address-company">
              {address.company}
            </Text>
          )}
          <Text className="mt-2 flex flex-col text-left text-base-regular">
            <span data-testid="address-address">
              {address.address_1}
              {address.address_2 && <span>, {address.address_2}</span>}
            </span>
            <span data-testid="address-postal-city">
              {address.postal_code && `${address.postal_code}, `}
              {address.city}
            </span>
            <span data-testid="address-province-country">
              {address.province && `${address.province}, `}
              {address.country_code?.toUpperCase()}
            </span>
          </Text>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            className="text-small-regular flex items-center gap-2 text-ui-fg-base hover:text-[var(--hp-accent)]"
            onClick={open}
            data-testid="address-edit-button"
          >
            <Edit />
            Sửa
          </button>
          <button
            type="button"
            className="text-small-regular flex items-center gap-2 text-ui-fg-base hover:text-[var(--hp-danger)]"
            onClick={removeAddress}
            disabled={removing}
            data-testid="address-delete-button"
          >
            {removing ? <Spinner /> : <Trash />}
            Xóa
          </button>
        </div>
      </div>

      <Modal isOpen={state} close={closeModal} data-testid="edit-address-modal">
        <Modal.Title>
          <Heading className="mb-2">Cập nhật địa chỉ</Heading>
        </Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label="Tên"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address.first_name || undefined}
                  data-testid="first-name-input"
                />
                <Input
                  label="Họ"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address.last_name || undefined}
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label="Công ty (không bắt buộc)"
                name="company"
                autoComplete="organization"
                defaultValue={address.company || undefined}
                data-testid="company-input"
              />
              <Input
                label="Địa chỉ chi tiết"
                name="address_1"
                required
                autoComplete="street-address"
                defaultValue={address.address_1 || undefined}
                data-testid="address-1-input"
              />
              <Input
                label="Tòa nhà, căn hộ (không bắt buộc)"
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address.address_2 || undefined}
                data-testid="address-2-input"
              />
              <VietnamAddressFields
                initialProvince={address.province || ""}
                initialCity={address.city || ""}
              />
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label="Mã bưu chính (không bắt buộc)"
                  name="postal_code"
                  autoComplete="postal-code"
                  defaultValue={address.postal_code || undefined}
                  data-testid="postal-code-input"
                />
                <Input
                  label="Số điện thoại (không bắt buộc)"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={address.phone || undefined}
                  data-testid="phone-input"
                />
              </div>
              <p className="type-product-spec text-[var(--hp-muted)]">
                Chỉ lưu địa chỉ tại Việt Nam.
              </p>
              <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--hp-ink)]">
                <input type="checkbox" name="is_default_shipping" defaultChecked={address.is_default_shipping} />
                Dùng làm địa chỉ giao hàng mặc định
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--hp-ink)]">
                <input type="checkbox" name="is_default_billing" defaultChecked={address.is_default_billing} />
                Dùng làm địa chỉ thanh toán mặc định
              </label>
            </div>
            {formState.error && (
              <div className="type-product-spec py-2 text-[var(--hp-danger)]" role="alert">
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" onClick={closeModal} className="h-10" data-testid="cancel-button">
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

export default EditAddress
