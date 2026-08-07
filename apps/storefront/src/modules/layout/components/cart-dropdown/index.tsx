"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { ShoppingCart } from "@medusajs/icons"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [activeTimer, setActiveTimer] = useState<ReturnType<typeof setTimeout>>()
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const pathname = usePathname()
  const totalItems =
    cartState?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems)

  const close = () => setCartDropdownOpen(false)
  const open = () => setCartDropdownOpen(true)
  const openAndCancel = () => {
    if (activeTimer) clearTimeout(activeTimer)
    open()
  }

  useEffect(() => {
    return () => {
      if (activeTimer) clearTimeout(activeTimer)
    }
  }, [activeTimer])

  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      open()
      const timer = setTimeout(close, 5000)
      setActiveTimer(timer)
      itemRef.current = totalItems
    }
  }, [pathname, totalItems])

  return (
    <div className="z-50 h-full" onMouseEnter={openAndCancel} onMouseLeave={close}>
      <Popover className="relative h-full">
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="type-header-label relative flex w-[70px] flex-col items-center justify-center gap-1 whitespace-nowrap text-center hover:text-[var(--hp-accent)]"
            href="/cart"
            data-testid="nav-cart-link"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Giỏ hàng</span>
            {totalItems > 0 && (
              <span className="absolute right-2 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--hp-accent)] px-1 text-[11px] font-semibold leading-none text-white tabular-nums">
                {totalItems}
              </span>
            )}
          </LocalizedClientLink>
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="absolute right-0 top-[calc(100%+1px)] hidden w-[min(420px,calc(100vw-2rem))] border-x border-b border-[var(--hp-line)] bg-white text-[var(--hp-ink)] shadow-[var(--hp-shadow-card)] small:block"
            data-testid="nav-cart-dropdown"
          >
            <div className="border-b border-[var(--hp-line)] px-5 py-4">
              <h3 className="type-product-title text-center text-base">Giỏ hàng</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="max-h-[402px] space-y-4 overflow-y-auto px-5 py-4 no-scrollbar">
                  {cartState.items
                    .slice()
                    .sort((a, b) =>
                      (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                    )
                    .map((item) => (
                      <div
                        className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 border-b border-[var(--hp-line)] pb-4 last:border-0 last:pb-0"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-20 shrink-0"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="min-w-0">
                          <h3 className="type-product-title line-clamp-2 text-sm">
                            <LocalizedClientLink href={`/products/${item.product_handle}`} data-testid="product-link">
                              {item.title}
                            </LocalizedClientLink>
                          </h3>
                          <LineItemOptions variant={item.variant} data-testid="cart-item-variant" />
                          <div className="mt-1 text-sm text-[var(--hp-muted)]" data-testid="cart-item-quantity">
                            Số lượng: {item.quantity}
                          </div>
                          <div className="mt-1 flex justify-end text-right">
                            <LineItemPrice item={item} style="tight" currencyCode={cartState.currency_code} />
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1"
                            data-testid="cart-item-remove-button"
                          >
                            Xóa sản phẩm
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="flex flex-col gap-4 border-t border-[var(--hp-line)] p-5 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold">Tạm tính</span>
                    <span className="shrink-0 text-right text-lg font-bold tabular-nums" data-testid="cart-subtotal" data-value={subtotal}>
                      {convertToLocale({ amount: subtotal, currency_code: cartState.currency_code })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button className="h-11 w-full" size="large" data-testid="go-to-cart-button">
                      Xem giỏ hàng
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 px-5 py-16 text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--hp-ink)] text-sm text-white">0</div>
                <span className="type-body text-[var(--hp-muted)]">Giỏ hàng của bạn đang trống.</span>
                <LocalizedClientLink href="/store">
                  <Button onClick={close}>Khám phá sản phẩm</Button>
                </LocalizedClientLink>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
