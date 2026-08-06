"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, GridLayout, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"

type SideMenuProps = {
  categories: HttpTypes.StoreProductCategory[] | null
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({
  categories,
  regions,
  locales,
  currentLocale,
}: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const topLevelCategories = (categories ?? [])
    .filter((category) => !category.parent_category)
    .slice(0, 12)

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

          {open && (
            <button
              type="button"
              aria-label="Đóng danh mục"
              className="fixed inset-0 z-[50] cursor-default bg-black/20"
              onClick={close}
            />
          )}

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
            <PopoverPanel className="absolute left-0 top-[calc(100%+10px)] z-[60] w-[min(92vw,520px)] rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-4 text-[var(--hp-ink)] shadow-[var(--hp-shadow-card)]">
              <div className="mb-3 flex items-center justify-between border-b border-[var(--hp-line)] pb-3">
                <div>
                  <p className="text-base font-bold">Danh mục sản phẩm</p>
                  <p className="mt-1 text-xs text-[var(--hp-muted)]">
                    Chọn nhóm sản phẩm để bắt đầu
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

              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {topLevelCategories.map((category) => (
                  <li key={category.id}>
                    <LocalizedClientLink
                      href={`/categories/${category.handle}`}
                      onClick={close}
                      className="flex items-center justify-between rounded-[var(--hp-radius-control)] px-3 py-3 text-sm font-semibold hover:bg-[var(--hp-accent-soft)] hover:text-[var(--hp-accent)]"
                    >
                      {category.name}
                      <ArrowRightMini className="h-4 w-4" />
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>

              {!topLevelCategories.length && (
                <p className="py-4 text-sm text-[var(--hp-muted)]">
                  Danh mục đang được cập nhật.
                </p>
              )}

              <div className="mt-4 flex flex-col gap-3 border-t border-[var(--hp-line)] pt-4 text-sm">
                <LocalizedClientLink
                  href="/store"
                  onClick={close}
                  className="font-semibold text-[var(--hp-accent)] hover:text-[var(--hp-accent-strong)]"
                >
                  Xem tất cả sản phẩm
                </LocalizedClientLink>
                {!!locales?.length && (
                  <div
                    className="flex items-center justify-between"
                    onMouseEnter={languageToggleState.open}
                    onMouseLeave={languageToggleState.close}
                  >
                    <LanguageSelect
                      toggleState={languageToggleState}
                      locales={locales}
                      currentLocale={currentLocale}
                    />
                    <ArrowRightMini
                      className={clx(
                        "h-4 w-4 transition-transform duration-150",
                        languageToggleState.state ? "rotate-90" : ""
                      )}
                    />
                  </div>
                )}
                {regions && (
                  <div
                    className="flex items-center justify-between"
                    onMouseEnter={countryToggleState.open}
                    onMouseLeave={countryToggleState.close}
                  >
                    <CountrySelect
                      toggleState={countryToggleState}
                      regions={regions}
                    />
                    <ArrowRightMini
                      className={clx(
                        "h-4 w-4 transition-transform duration-150",
                        countryToggleState.state ? "rotate-90" : ""
                      )}
                    />
                  </div>
                )}
                <Text className="pt-1 text-xs text-[var(--hp-muted)]">
                  Thiết kế cho trải nghiệm mua sắm rõ ràng và dễ kiểm chứng.
                </Text>
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

export default SideMenu
