"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import {
  CATALOG_BRAND_QUERY_KEY,
  CATALOG_SPEC_QUERY_KEY,
  CATALOG_PRICE_QUERY_KEY,
  CatalogFacets,
  catalogSpecToken,
  parseCatalogFilters,
} from "@lib/util/catalog-filters"
import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import BrandMark from "@modules/common/components/brand-mark"
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
      const currentPath = currentQuery
        ? `${pathname}?${currentQuery}`
        : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath)
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
      valueIds.forEach((valueId) =>
        params.append(OPTION_VALUE_QUERY_KEY, valueId)
      )
    })

  const selectedCatalogFilters = useMemo(
    () => parseCatalogFilters(searchParams),
    [searchParams],
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

  const clearRefinements = () =>
    updateQueryParams((params) => {
      params.delete("sortBy")
      params.delete(OPTION_VALUE_QUERY_KEY)
      params.delete("category_id")
      params.delete(CATALOG_BRAND_QUERY_KEY)
      params.delete(CATALOG_SPEC_QUERY_KEY)
      params.delete(CATALOG_PRICE_QUERY_KEY)
    })

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between border-b border-[var(--hp-line)] pb-3">
        <h2 className="text-base font-semibold text-[var(--hp-ink)]">Bộ lọc</h2>
        <button
          type="button"
          onClick={clearRefinements}
          className="text-[13px] font-medium text-[var(--hp-accent)] hover:text-[var(--hp-accent-strong)]"
        >
          Xóa lọc
        </button>
      </div>
      {!hideSort && (
        <SortProducts
          sortBy={sortBy}
          setQueryParams={setQueryParams}
          data-testid={dataTestId}
        />
      )}
      {categories.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-semibold text-[var(--hp-ink)]">Danh mục</legend>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((category) => !category.parent_category)
              .map((category) => {
                const isSelected = searchParams.get("category_id") === category.id
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => updateQueryParams((params) => {
                      if (isSelected) params.delete("category_id")
                      else params.set("category_id", category.id)
                    })}
                    className={`min-h-10 rounded-[var(--hp-radius-control)] border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2 ${isSelected ? "border-[var(--hp-accent)] bg-[var(--hp-accent-soft)] text-[var(--hp-accent)]" : "border-[var(--hp-line)] bg-[var(--hp-surface)] text-[var(--hp-ink)] hover:border-[var(--hp-accent)]"}`}
                    aria-pressed={isSelected}
                  >
                    {category.name}
                  </button>
                )
              })}
          </div>
        </fieldset>
      )}
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
      {catalogFacets?.specifications.map((facet) => (
        <FacetGroup
          key={facet.key}
          label={
            facet.group === "Thông số"
              ? facet.label
              : `${facet.group} · ${facet.label}`
          }
          values={facet.values}
          selectedValues={selectedCatalogFilters.specifications[facet.key] ?? []}
          onToggle={(value) =>
            toggleRepeatedQueryValue(
              CATALOG_SPEC_QUERY_KEY,
              catalogSpecToken(facet.key, value),
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
}

function FacetGroup({
  label,
  values,
  selectedValues,
  onToggle,
  showBrandMark = false,
}: {
  label: string
  values: {
    value: string
    label: string
    count: number
    logoUrl?: string | null
  }[]
  selectedValues: string[]
  onToggle: (value: string) => void
  showBrandMark?: boolean
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-semibold text-[var(--hp-ink)]">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {values.map((item) => {
          const isSelected = selectedValues.includes(item.value)
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onToggle(item.value)}
              className={`inline-flex min-h-10 items-center rounded-[var(--hp-radius-control)] border px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-[var(--hp-accent)] bg-[var(--hp-accent-soft)] text-[var(--hp-accent)]"
                  : "border-[var(--hp-line)] bg-[var(--hp-surface)] text-[var(--hp-ink)] hover:border-[var(--hp-accent)]"
              }`}
              aria-pressed={isSelected}
            >
              {showBrandMark ? (
                <BrandMark
                  name={item.label}
                  logoUrl={item.logoUrl}
                  className="mr-2 h-6 w-6 rounded"
                />
              ) : null}
              {item.label}
              <span className="ml-1 text-xs text-[var(--hp-muted)]">
                {item.count}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default RefinementList
