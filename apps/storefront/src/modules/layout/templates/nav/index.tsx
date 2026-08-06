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
        <div className="content-container flex h-8 items-center justify-between text-xs">
          <p>Thiết bị chính hãng, giá rõ ràng, hỗ trợ tận tâm</p>
          <div className="flex items-center gap-5 text-white/90">
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
        <nav className="content-container flex min-h-[72px] w-full items-center gap-3 py-3 lg:gap-5">
          <div className="shrink-0">
            <SideMenu
              categories={categories}
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
            />
          </div>

          <LocalizedClientLink
            href="/"
            className="flex shrink-0 flex-col leading-none text-[var(--hp-ink)]"
            data-testid="nav-store-link"
          >
            <span className="text-lg font-extrabold tracking-[-0.04em] sm:text-xl">
              HƯNG PHÁT
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hp-accent)]">
              Điện tử tin cậy
            </span>
          </LocalizedClientLink>

          <div className="hidden min-w-0 flex-1 lg:flex">
            <SearchBar countryCode={countryCode} />
          </div>

          <div className="ml-auto flex items-center gap-3 text-sm font-semibold text-[var(--hp-ink)] sm:gap-5">
            <LocalizedClientLink
              className="hidden whitespace-nowrap hover:text-[var(--hp-accent)] lg:block"
              href="/account/orders"
              data-testid="nav-account-orders-link"
            >
              Đơn hàng
            </LocalizedClientLink>
            <LocalizedClientLink
              className="hidden whitespace-nowrap hover:text-[var(--hp-accent)] sm:block"
              href="/account"
              data-testid="nav-account-link"
            >
              Tài khoản
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="whitespace-nowrap hover:text-[var(--hp-accent)]"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Giỏ hàng (0)
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
