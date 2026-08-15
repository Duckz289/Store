"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import {
  CATALOG_AVAILABILITY_QUERY_KEY,
  CATALOG_BRAND_QUERY_KEY,
  CATALOG_CATEGORY_QUERY_KEY,
  CATALOG_FILTER_QUERY_KEYS,
  CATALOG_PRICE_QUERY_KEY,
  CATALOG_SPEC_QUERY_KEY,
  CatalogFacetValue,
  CatalogFacets,
  catalogSpecToken,
  countActiveCatalogFilters,
  describeCatalogSelection,
  parseCatalogFilters,
} from "@lib/util/catalog-filters"
import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import BrandMark from "@modules/common/components/brand-mark"
import { clx } from "@modules/common/components/ui"
import { XMark } from "@medusajs/icons"
import OptionsPicker from "./options-picker"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  hideOptionsPicker?: boolean
  hideSort?: boolean
  categories?: HttpTypes.StoreProductCategory[]
  catalogFacets?: CatalogFacets
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  hideOptionsPicker = false,
  hideSort = false,
  categories = [],
  catalogFacets,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)

      params.delete("page")

      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery ? `${pathname}?${currentQuery}` : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath, { scroll: false })
      }
    },
    [pathname, router, searchParams]
  )

  const setQueryParams = (name: string, value: string) =>
    updateQueryParams((params) => params.set(name, value))

  const selectedOptionValueIds = useMemo(
    () => parseOptionValueIds(searchParams),
    [searchParams]
  )

  const setOptionValueIds = (valueIds: string[]) =>
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
      valueIds.forEach((valueId) => params.append(OPTION_VALUE_QUERY_KEY, valueId))
    })

  const selectedCatalogFilters = useMemo(
    () => parseCatalogFilters(searchParams),
    [searchParams]
  )

  const activeCount = countActiveCatalogFilters(selectedCatalogFilters)
  const activeChips = useMemo(
    () =>
      catalogFacets
        ? describeCatalogSelection(selectedCatalogFilters, catalogFacets)
        : [],
    [catalogFacets, selectedCatalogFilters]
  )

  const toggleRepeatedQueryValue = (name: string, value: string) =>
    updateQueryParams((params) => {
      const current = params.getAll(name)
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      params.delete(name)
      next.forEach((item) => params.append(name, item))
    })

  const removeQueryValue = (name: string, value: string) =>
    updateQueryParams((params) => {
      const next = params.getAll(name).filter((item) => item !== value)
      params.delete(name)
      next.forEach((item) => params.append(name, item))
    })

  const clearRefinements = () =>
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
      params.delete("category_id")
      CATALOG_FILTER_QUERY_KEYS.forEach((key) => params.delete(key))
    })

  const topLevelCategories = categories.filter(
    (category) => !category.parent_category
  )

  const panel = (
    <div className="flex flex-col gap-7">
      {!hideSort && (
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      )}

      {topLevelCategories.length > 0 && (
        <FacetGroup
          label="Danh mục"
          values={topLevelCategories.map((category) => ({
            value: category.id,
            label: category.name,
            count: 0,
          }))}
          hideCounts
          selectedValues={
            searchParams.get("category_id") ? [searchParams.get("category_id")!] : []
          }
          onToggle={(value) =>
            updateQueryParams((params) => {
              if (params.get("category_id") === value) params.delete("category_id")
              else params.set("category_id", value)
            })
          }
        />
      )}

      {catalogFacets?.categories.length ? (
        <FacetGroup
          label="Danh mục con"
          values={catalogFacets.categories}
          selectedValues={selectedCatalogFilters.categories}
          onToggle={(value) =>
            toggleRepeatedQueryValue(CATALOG_CATEGORY_QUERY_KEY, value)
          }
        />
      ) : null}

      {catalogFacets?.brands.length ? (
        <FacetGroup
          label="Hãng sản xuất"
          values={catalogFacets.brands}
          showBrandMark
          selectedValues={selectedCatalogFilters.brands}
          onToggle={(value) =>
            toggleRepeatedQueryValue(CATALOG_BRAND_QUERY_KEY, value)
          }
        />
      ) : null}

      {catalogFacets?.prices.length ? (
        <FacetGroup
          label="Khoảng giá"
          values={catalogFacets.prices}
          selectedValues={selectedCatalogFilters.prices}
          onToggle={(value) =>
            toggleRepeatedQueryValue(CATALOG_PRICE_QUERY_KEY, value)
          }
        />
      ) : null}

      {catalogFacets?.availability.length ? (
        <FacetGroup
          label="Tình trạng"
          values={catalogFacets.availability}
          selectedValues={selectedCatalogFilters.availability}
          onToggle={(value) =>
            toggleRepeatedQueryValue(CATALOG_AVAILABILITY_QUERY_KEY, value)
          }
        />
      ) : null}

      {catalogFacets?.specifications.map((facet) => (
        <FacetGroup
          key={facet.key}
          label={
            facet.group === "Thông số" || facet.group === facet.label
              ? facet.label
              : `${facet.group} · ${facet.label}`
          }
          values={facet.values}
          selectedValues={selectedCatalogFilters.specifications[facet.key] ?? []}
          onToggle={(value) =>
            toggleRepeatedQueryValue(
              CATALOG_SPEC_QUERY_KEY,
              catalogSpecToken(facet.key, value)
            )
          }
        />
      ))}

      {!hideOptionsPicker && !catalogFacets && (
        <OptionsPicker
          selectedValueIds={selectedOptionValueIds}
          setOptionValueIds={setOptionValueIds}
        />
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--hp-line)] pb-3">
        <h2 className="text-base font-semibold text-[var(--hp-ink)]">
          Bộ lọc
          {activeCount > 0 ? (
            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--hp-accent)] px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </h2>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={clearRefinements}
            className="text-[13px] font-medium text-[var(--hp-accent)] hover:text-[var(--hp-accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"
            data-testid="clear-filters-button"
          >
            Xóa tất cả
          </button>
        ) : null}
      </div>

      {activeChips.length ? (
        <ul
          className="flex flex-wrap gap-2"
          aria-label="Bộ lọc đang áp dụng"
          data-testid="active-filters"
        >
          {activeChips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => removeQueryValue(chip.queryKey, chip.value)}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--hp-accent)] bg-[var(--hp-accent-soft)] px-3 text-[13px] font-semibold text-[var(--hp-accent)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"
              >
                {chip.label}
                <XMark className="h-3.5 w-3.5" />
                <span className="sr-only">Bỏ lọc {chip.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {panel}
    </div>
  )
}

function FacetGroup({
  label,
  values,
  selectedValues,
  onToggle,
  showBrandMark = false,
  hideCounts = false,
}: {
  label: string
  values: CatalogFacetValue[]
  selectedValues: string[]
  onToggle: (value: string) => void
  showBrandMark?: boolean
  hideCounts?: boolean
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-[var(--hp-ink)]">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => {
          const isSelected = selectedValues.includes(item.value)
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onToggle(item.value)}
              className={clx(
                "inline-flex min-h-10 items-center gap-2 rounded-[var(--hp-radius-control)] border px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2",
                isSelected
                  ? "border-[var(--hp-accent)] bg-[var(--hp-accent-soft)] text-[var(--hp-accent)]"
                  : "border-[var(--hp-line)] bg-[var(--hp-surface)] text-[var(--hp-ink)] hover:border-[var(--hp-accent)]"
              )}
              aria-pressed={isSelected}
            >
              {showBrandMark ? (
                <BrandMark
                  name={item.label}
                  logoUrl={item.logoUrl}
                  logoAlt={item.logoAlt}
                  className="h-6 w-9 rounded-sm"
                />
              ) : null}
              {item.label}
              {hideCounts ? null : (
                <span className="text-xs text-[var(--hp-muted)]">{item.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default RefinementList
