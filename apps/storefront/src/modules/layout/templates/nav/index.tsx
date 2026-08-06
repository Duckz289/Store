import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SearchBar from "@modules/layout/components/search-bar"
import SideMenu from "@modules/layout/components/side-menu"
import { ShoppingBag, ShoppingCart, User, Wrench } from "@medusajs/icons"

export default async function Nav({ countryCode }: { countryCode: string }) {
  const [regions, locales, currentLocale, categories] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions).catch(() => []),
    listLocales().catch(() => []),
    getLocale().catch(() => null),
    listCategories().catch(() => [] as HttpTypes.StoreProductCategory[]),
  ])

  return (
    <div className="sticky inset-x-0 top-0 z-50">
      <div className="hidden border-b border-[var(--hp-accent-soft)] bg-[var(--hp-accent)] text-white lg:block">
        <div className="content-container flex h-7 items-center justify-between text-[12px] font-medium">
          <p>Miễn phí giao hàng từ 500K · Hàng chính hãng</p>
          <div className="flex items-center gap-6 text-white/90">
            <LocalizedClientLink href="/#repair" className="hover:text-white">
              Dịch vụ sửa chữa
            </LocalizedClientLink>
            <LocalizedClientLink href="/account/orders" className="hover:text-white">
              Tra cứu đơn hàng
            </LocalizedClientLink>
          </div>
        </div>
      </div>
      <header className="border-b border-[var(--hp-line)] bg-[var(--hp-surface)]">
        <nav className="content-container flex min-h-[72px] w-full items-center gap-2 py-3 lg:gap-4">
          <LocalizedClientLink
            href="/"
            className="flex shrink-0 flex-col leading-none text-[var(--hp-ink)]"
            data-testid="nav-store-link"
          >
            <span className="text-lg font-bold tracking-[-0.025em] sm:text-xl">
              HƯNG PHÁT
            </span>
            <span className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hp-accent)] sm:block">
              Điện tử tin cậy
            </span>
          </LocalizedClientLink>

          <div className="order-first shrink-0 sm:order-none">
            <SideMenu
              categories={categories}
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
            />
          </div>

          <div className="hidden min-w-0 flex-1 lg:flex">
            <SearchBar countryCode={countryCode} />
          </div>

          <div className="ml-auto flex h-12 items-stretch gap-0 text-[var(--hp-ink)]">
            <LocalizedClientLink
              className="type-header-label hidden w-[74px] flex-col items-center justify-center gap-1 text-center hover:text-[var(--hp-accent)] lg:flex"
              href="/account/orders"
              data-testid="nav-account-orders-link"
            >
              <ShoppingBag className="h-5 w-5" />
              Đơn hàng
            </LocalizedClientLink>
            <LocalizedClientLink
              className="type-header-label hidden w-[74px] flex-col items-center justify-center gap-1 text-center hover:text-[var(--hp-accent)] lg:flex"
              href="/#repair"
            >
              <Wrench className="h-5 w-5" />
              Sửa chữa
            </LocalizedClientLink>
            <LocalizedClientLink
              className="type-header-label flex w-[70px] flex-col items-center justify-center gap-1 whitespace-nowrap text-center hover:text-[var(--hp-accent)]"
              href="/account"
              data-testid="nav-account-link"
            >
              <User className="h-5 w-5" />
              Tài khoản
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="type-header-label flex w-[70px] flex-col items-center justify-center gap-1 whitespace-nowrap text-center hover:text-[var(--hp-accent)]"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Giỏ hàng
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
        <div className="border-t border-[var(--hp-line)] px-4 py-2 lg:hidden">
          <SearchBar countryCode={countryCode} />
        </div>
      </header>
    </div>
  )
}
