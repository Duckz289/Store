"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import OptionsPicker from "./options-picker"
import SortProducts, { SortOptions } from "./sort-products"

type RefinementListProps = {
  sortBy: SortOptions
  hideOptionsPicker?: boolean
  hideSort?: boolean
  categories?: HttpTypes.StoreProductCategory[]
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  hideOptionsPicker = false,
  hideSort = false,
  categories = [],
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

  const clearRefinements = () =>
    updateQueryParams((params) => {
      params.delete("sortBy")
      params.delete(OPTION_VALUE_QUERY_KEY)
      params.delete("category_id")
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
      {!hideOptionsPicker && (
        <OptionsPicker
          selectedValueIds={selectedOptionValueIds}
          setOptionValueIds={setOptionValueIds}
        />
      )}
    </div>
  )
}

export default RefinementList
