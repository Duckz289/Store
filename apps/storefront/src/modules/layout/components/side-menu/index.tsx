"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { Locale } from "@lib/data/locales"
import type { CatalogNavigationGroup } from "@lib/data/catalog-navigation"
import { CATALOG_PRICE_RANGES } from "@lib/util/catalog-filters"
import { convertToLocale } from "@lib/util/money"
import {
  ArrowRightMini,
  GridLayout,
  Mailbox,
  Wrench,
  XMark,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BrandMark from "@modules/common/components/brand-mark"
import { clx } from "@modules/common/components/ui"
import { Fragment, useEffect, useMemo, useState } from "react"

import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"

type SideMenuProps = {
  categories: HttpTypes.StoreProductCategory[] | null
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  catalogNavigation: CatalogNavigationGroup[]
}

const SideMenu = ({
  categories,
  regions,
  locales,
  currentLocale,
  catalogNavigation,
}: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const topLevelCategories = useMemo(
    () =>
      (categories ?? [])
        .filter((category) => !category.parent_category)
        .slice(0, 12),
    [categories],
  )
  const [activeCategoryId, setActiveCategoryId] = useState(
    topLevelCategories[0]?.id ?? "",
  )

  useEffect(() => {
    if (
      topLevelCategories.length &&
      !topLevelCategories.some((category) => category.id === activeCategoryId)
    ) {
      setActiveCategoryId(topLevelCategories[0].id)
    }
  }, [activeCategoryId, topLevelCategories])

  const activeCategory =
    topLevelCategories.find((category) => category.id === activeCategoryId) ??
    topLevelCategories[0]
  const activeCategoryIds = new Set([
    activeCategory?.id,
    ...(activeCategory?.category_children ?? []).map((category) => category.id),
  ])
  const activeNavigation = catalogNavigation.filter((group) =>
    activeCategoryIds.has(group.categoryId),
  )
  // Only brands with a real logo belong in the logo row; the rest stay reachable
  // through the filter panel as plain text chips.
  const activeBrands = mergeChips(
    activeNavigation.flatMap((group) => group.brands),
    (brand) => brand.handle,
    (brand) => brand.name,
  )
    .filter((brand) => Boolean(brand.logoUrl?.trim()))
    .slice(0, 12)
  const activeProducts = Array.from(
    new Map(
      activeNavigation
        .flatMap((group) => group.products)
        .map((product) => [product.id, product]),
    ).values(),
  ).slice(0, 6)
  const activePriceBands = orderPriceBands(
    mergeChips(
      activeNavigation.flatMap((group) => group.priceBands),
      (band) => band.value,
    ),
  )
  const activeUseCases = mergeChips(
    activeNavigation.flatMap((group) => group.useCases),
    (useCase) => useCase.value,
  ).slice(0, 8)
  const activeDeviceTypes = mergeChips(
    activeNavigation.flatMap((group) => group.deviceTypes),
    (deviceType) => deviceType.value,
  ).slice(0, 8)
  const categoryHref = activeCategory
    ? `/categories/${activeCategory.handle}`
    : "/store"

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <Popover.Button
            data-testid="nav-menu-button"
            className="type-header-label flex h-11 items-center gap-2 rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] px-3 text-[var(--hp-ink)] transition-colors hover:border-[var(--hp-accent)] hover:text-[var(--hp-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] sm:px-4"
          >
            <GridLayout className="h-5 w-5" />
            <span className="hidden sm:inline">Danh mục</span>
          </Popover.Button>

          {open ? (
            <button
              type="button"
              aria-label="Đóng danh mục"
              className="fixed inset-0 z-[50] cursor-default bg-black/35"
              onClick={close}
            />
          ) : null}

          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <PopoverPanel className="fixed inset-x-4 top-[76px] z-[60] max-h-[calc(100dvh-92px)] overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] text-[var(--hp-ink)] shadow-[var(--hp-shadow-card)] lg:left-1/2 lg:right-auto lg:top-[108px] lg:w-[min(1080px,calc(100vw-32px))] lg:-translate-x-1/2">
              <div className="flex items-center justify-between border-b border-[var(--hp-line)] px-4 py-3 lg:px-5">
                <div>
                  <p className="text-base font-bold">Danh mục sản phẩm</p>
                  <p className="mt-1 text-xs text-[var(--hp-muted)]">
                    Tìm theo loại thiết bị, hãng hoặc sản phẩm
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--hp-muted)] hover:bg-[var(--hp-paper)] hover:text-[var(--hp-ink)]"
                  aria-label="Đóng danh mục"
                >
                  <XMark className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[calc(100dvh-204px)] overflow-y-auto lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
                <div className="flex gap-2 overflow-x-auto border-b border-[var(--hp-line)] p-3 lg:block lg:border-b-0 lg:border-r lg:p-3">
                  {topLevelCategories.map((category) => {
                    const active = category.id === activeCategory?.id
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onMouseEnter={() => setActiveCategoryId(category.id)}
                        onFocus={() => setActiveCategoryId(category.id)}
                        onClick={() => setActiveCategoryId(category.id)}
                        className={clx(
                          "flex shrink-0 items-center justify-between gap-3 rounded-[var(--hp-radius-control)] px-3 py-3 text-left text-sm font-semibold transition-colors lg:mb-1 lg:w-full",
                          active
                            ? "bg-[var(--hp-accent-soft)] text-[var(--hp-accent)]"
                            : "hover:bg-[var(--hp-paper)]",
                        )}
                        aria-pressed={active}
                      >
                        {category.name}
                        <ArrowRightMini className="hidden h-4 w-4 lg:block" />
                      </button>
                    )
                  })}
                </div>

                <section className="min-w-0 p-4 lg:p-6">
                  {activeCategory ? (
                    <>
                      <div className="flex items-center justify-between gap-4">
                        <h2 className="text-lg font-bold">
                          {activeCategory.name}
                        </h2>
                        <LocalizedClientLink
                          href={`/categories/${activeCategory.handle}`}
                          onClick={close}
                          className="shrink-0 text-sm font-semibold text-[var(--hp-accent)] hover:text-[var(--hp-accent-strong)]"
                        >
                          Xem tất cả
                        </LocalizedClientLink>
                      </div>

                      {activeCategory.category_children?.length ||
                      activeDeviceTypes.length ? (
                        <MenuSection title="Loại thiết bị">
                          {activeCategory.category_children?.map((category) => (
                            <LocalizedClientLink
                              key={category.id}
                              href={`/categories/${category.handle}`}
                              onClick={close}
                              className={CHIP_CLASS}
                            >
                              {category.name}
                            </LocalizedClientLink>
                          ))}
                          {!activeCategory.category_children?.length
                            ? activeDeviceTypes.map((deviceType) => (
                                <LocalizedClientLink
                                  key={deviceType.value}
                                  href={`${categoryHref}?spec=${encodeURIComponent(
                                    `appliance_type:${deviceType.value}`,
                                  )}`}
                                  onClick={close}
                                  className={CHIP_CLASS}
                                >
                                  {deviceType.label}
                                  <span className={CHIP_COUNT_CLASS}>
                                    {deviceType.count}
                                  </span>
                                </LocalizedClientLink>
                              ))
                            : null}
                        </MenuSection>
                      ) : null}

                      {activeBrands.length ? (
                        <MenuSection title="Hãng đang có hàng">
                          {activeBrands.map((brand) => (
                            <LocalizedClientLink
                              key={brand.handle}
                              href={`${categoryHref}?brand=${encodeURIComponent(brand.handle)}`}
                              onClick={close}
                              className="inline-flex min-h-10 items-center gap-2 rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-white px-2.5 py-1.5 text-sm font-bold transition-colors hover:border-[var(--hp-accent)] hover:text-[var(--hp-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"
                            >
                              <BrandMark
                                name={brand.name}
                                logoUrl={brand.logoUrl}
                                logoAlt={brand.logoAlt}
                                className="h-6 w-9 rounded-sm border-0"
                              />
                              {brand.name}
                              <span className={CHIP_COUNT_CLASS}>{brand.count}</span>
                            </LocalizedClientLink>
                          ))}
                        </MenuSection>
                      ) : null}

                      {activeUseCases.length ? (
                        <MenuSection title="Nhu cầu sử dụng">
                          {activeUseCases.map((useCase) => (
                            <LocalizedClientLink
                              key={useCase.value}
                              href={`${categoryHref}?spec=${encodeURIComponent(
                                `purpose:${useCase.value}`,
                              )}`}
                              onClick={close}
                              className={CHIP_CLASS}
                            >
                              {useCase.label}
                              <span className={CHIP_COUNT_CLASS}>{useCase.count}</span>
                            </LocalizedClientLink>
                          ))}
                        </MenuSection>
                      ) : null}

                      {activePriceBands.length ? (
                        <MenuSection title="Mức giá">
                          {activePriceBands.map((band) => (
                            <LocalizedClientLink
                              key={band.value}
                              href={`${categoryHref}?price=${encodeURIComponent(band.value)}`}
                              onClick={close}
                              className={CHIP_CLASS}
                            >
                              {band.label}
                              <span className={CHIP_COUNT_CLASS}>{band.count}</span>
                            </LocalizedClientLink>
                          ))}
                        </MenuSection>
                      ) : null}

                      {activeProducts.length ? (
                        <div className="mt-5">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--hp-muted)]">
                            Sản phẩm nổi bật
                          </h3>
                          <div className="mt-2 grid gap-x-5 gap-y-1 sm:grid-cols-2">
                            {activeProducts.map((product) => (
                              <LocalizedClientLink
                                key={product.id}
                                href={`/products/${product.handle}`}
                                onClick={close}
                                className="flex items-center gap-3 rounded-[var(--hp-radius-control)] px-2 py-2.5 text-sm hover:bg-[var(--hp-paper)] hover:text-[var(--hp-accent)]"
                              >
                                {/* Fixed slot so rows stay aligned whether or not
                                    the brand has a logo to show. */}
                                <span className="flex h-7 w-10 shrink-0 items-center justify-center">
                                  <BrandMark
                                    name={product.brandName ?? ""}
                                    logoUrl={product.brandLogoUrl}
                                    className="h-7 w-10 rounded-sm"
                                  />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="line-clamp-1">{product.title}</span>
                                  {product.price !== null ? (
                                    <span className="mt-0.5 block text-xs font-semibold text-[var(--hp-accent)]">
                                      {convertToLocale({
                                        amount: product.price,
                                        currency_code: "vnd",
                                        maximumFractionDigits: 0,
                                      })}
                                    </span>
                                  ) : null}
                                </span>
                                <ArrowRightMini className="h-4 w-4 shrink-0" />
                              </LocalizedClientLink>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-6 rounded-[var(--hp-radius-control)] border border-dashed border-[var(--hp-line)] p-5 text-sm text-[var(--hp-muted)]">
                          Danh mục đang được cập nhật sản phẩm. Bạn vẫn có thể tạo sản phẩm mới trong Admin.
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[var(--hp-muted)]">
                      Danh mục đang được cập nhật.
                    </p>
                  )}
                </section>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--hp-line)] bg-[var(--hp-paper)] px-4 py-3 text-sm">
                <LocalizedClientLink
                  href="/store"
                  onClick={close}
                  className="font-semibold text-[var(--hp-accent)]"
                >
                  Tất cả sản phẩm
                </LocalizedClientLink>
                <span className="h-4 w-px bg-[var(--hp-line)]" />
                <LocalizedClientLink
                  href="/repair"
                  onClick={close}
                  className="inline-flex items-center gap-1.5 font-semibold"
                >
                  <Wrench className="h-4 w-4" />
                  Sửa chữa
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/repair/inbox"
                  onClick={close}
                  className="inline-flex items-center gap-1.5 font-semibold"
                >
                  <Mailbox className="h-4 w-4" />
                  Tra cứu báo giá
                </LocalizedClientLink>
                <div className="ml-auto flex items-center gap-3">
                  {!!locales?.length ? (
                    <div
                      onMouseEnter={languageToggleState.open}
                      onMouseLeave={languageToggleState.close}
                    >
                      <LanguageSelect
                        toggleState={languageToggleState}
                        locales={locales}
                        currentLocale={currentLocale}
                      />
                    </div>
                  ) : null}
                  {regions ? (
                    <div
                      onMouseEnter={countryToggleState.open}
                      onMouseLeave={countryToggleState.close}
                    >
                      <CountrySelect
                        toggleState={countryToggleState}
                        regions={regions}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

const CHIP_CLASS =
  "inline-flex min-h-10 items-center gap-1.5 rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-3 py-2 text-sm font-semibold transition-colors hover:border-[var(--hp-accent)] hover:text-[var(--hp-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"

const CHIP_COUNT_CLASS = "text-xs font-medium text-[var(--hp-muted)]"

function MenuSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--hp-muted)]">
        {title}
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

/** Folds duplicate chips coming from a parent and its child categories. */
function mergeChips<T extends { count: number }>(
  items: T[],
  keyOf: (item: T) => string,
  labelOf: (item: T) => string = (item) =>
    (item as { label?: string }).label ?? "",
) {
  const merged = new Map<string, T>()
  for (const item of items) {
    const key = keyOf(item)
    const current = merged.get(key)
    merged.set(
      key,
      current ? { ...current, ...item, count: current.count + item.count } : item,
    )
  }
  return Array.from(merged.values()).sort(
    (left, right) =>
      right.count - left.count ||
      labelOf(left).localeCompare(labelOf(right), "vi"),
  )
}

function orderPriceBands<T extends { value: string }>(bands: T[]) {
  return CATALOG_PRICE_RANGES.map((range) =>
    bands.find((band) => band.value === range.handle),
  ).filter((band): band is T => Boolean(band))
}

export default SideMenu
