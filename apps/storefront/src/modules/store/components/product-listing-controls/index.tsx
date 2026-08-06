"use client"

import { Dialog, Transition } from "@headlessui/react"
import { Adjustments, X } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import RefinementList from "@modules/store/components/refinement-list"
import SortProducts, {
  SortOptions,
} from "@modules/store/components/refinement-list/sort-products"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment, useCallback, useState } from "react"

type ProductListingControlsProps = {
  count: number
  sortBy: SortOptions
  categories?: HttpTypes.StoreProductCategory[]
}

const ProductListingControls = ({
  count,
  sortBy,
  categories,
}: ProductListingControlsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const setQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--hp-line)] py-3">
        <p className="text-sm text-[var(--hp-muted)]" aria-live="polite">
          <span className="font-semibold text-[var(--hp-ink)]">{count}</span> sản phẩm
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-3 text-sm font-medium text-[var(--hp-ink)] lg:hidden"
            aria-haspopup="dialog"
          >
            <Adjustments className="h-4 w-4" />
            Lọc
          </button>
          <div className="hidden lg:block">
            <SortProducts compact sortBy={sortBy} setQueryParams={setQueryParams} />
          </div>
        </div>
      </div>

      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[80] lg:hidden" onClose={setIsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/35" />
          </Transition.Child>
          <div className="fixed inset-x-0 bottom-0 max-h-[88dvh] overflow-hidden rounded-t-[18px] bg-[var(--hp-surface)] shadow-[0_-12px_32px_rgba(16,24,40,0.16)]">
            <Dialog.Panel className="flex max-h-[88dvh] flex-col">
              <div className="flex items-center justify-between border-b border-[var(--hp-line)] px-5 py-4">
                <Dialog.Title className="text-lg font-semibold text-[var(--hp-ink)]">Lọc và sắp xếp</Dialog.Title>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--hp-radius-control)] text-[var(--hp-ink)] hover:bg-[var(--hp-paper)]"
                  aria-label="Đóng bộ lọc"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-5">
                <RefinementList sortBy={sortBy} categories={categories} />
              </div>
              <div className="border-t border-[var(--hp-line)] p-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-11 w-full rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--hp-accent-strong)]"
                >
                  Xem {count} sản phẩm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default ProductListingControls
