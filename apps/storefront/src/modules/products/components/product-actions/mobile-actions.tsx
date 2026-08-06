"use client"

import { Dialog, Transition } from "@headlessui/react"
import { ChevronDownMini, X } from "@medusajs/icons"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@modules/common/components/ui"
import { Fragment, useMemo, useState } from "react"
import OptionSelect from "./option-select"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (optionId: string, value: string) => void
  inStock?: boolean
  handleAddToCart: () => void
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
}

const MobileActions = ({ product, variant, options, updateOptions, inStock, handleAddToCart, isAdding, show, optionsDisabled }: MobileActionsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const price = getProductPrice({ product, variantId: variant?.id })
  const selectedPrice = useMemo(() => price.variantPrice || price.cheapestPrice || null, [price.cheapestPrice, price.variantPrice])
  const isSimple = (product.variants?.length ?? 0) <= 1

  return (
    <>
      <div className={clx("fixed inset-x-0 bottom-0 z-50 border-t border-[var(--hp-line)] bg-[var(--hp-surface)] p-3 shadow-[0_-8px_24px_rgba(16,24,40,0.12)] lg:hidden", { "pointer-events-none opacity-0": !show })} data-testid="mobile-actions">
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-[13px] font-medium text-[var(--hp-muted)]">{product.title}</p>
            {selectedPrice ? <p className="type-product-price mt-1 text-[var(--hp-accent)]">{selectedPrice.calculated_price}</p> : null}
          </div>
          {!isSimple && <Button onClick={() => setIsOpen(true)} variant="secondary" className="h-11 shrink-0 !border-[var(--hp-line)] !text-[var(--hp-ink)]">Chọn</Button>}
          <Button onClick={handleAddToCart} disabled={!inStock || !variant} className="h-11 shrink-0 !bg-[var(--hp-accent)] !text-white hover:!bg-[var(--hp-accent-strong)]" isLoading={isAdding} data-testid="mobile-cart-button">
            {!variant ? "Chọn mẫu" : !inStock ? "Hết hàng" : "Thêm giỏ"}
          </Button>
        </div>
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[80]" onClose={setIsOpen}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/35" />
          </Transition.Child>
          <div className="fixed inset-x-0 bottom-0">
            <Dialog.Panel className="rounded-t-[18px] bg-[var(--hp-surface)] px-5 pb-6 pt-4 shadow-[0_-12px_32px_rgba(16,24,40,0.16)]">
              <div className="mb-5 flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-[var(--hp-ink)]">Chọn phiên bản</Dialog.Title>
                <button type="button" onClick={() => setIsOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--hp-radius-control)] hover:bg-[var(--hp-paper)]" aria-label="Đóng chọn phiên bản"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex flex-col gap-5">
                {(product.options || []).map((option) => <OptionSelect key={option.id} option={option} current={options[option.id]} updateOption={updateOptions} title={option.title ?? ""} disabled={optionsDisabled} />)}
                <button type="button" onClick={() => setIsOpen(false)} className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-4 text-sm font-semibold text-white"><ChevronDownMini className="h-4 w-4" />Xác nhận</button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
