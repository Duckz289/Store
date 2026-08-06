"use client"

import { ChevronDownMini } from "@medusajs/icons"
import FilterRadioGroup from "@modules/common/components/filter-radio-group"

export type SortOptions = "price_asc" | "price_desc" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: string) => void
  compact?: boolean
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at",
    label: "Mới cập nhật",
  },
  {
    value: "price_asc",
    label: "Giá tăng dần",
  },
  {
    value: "price_desc",
    label: "Giá giảm dần",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
  compact = false,
}: SortProductsProps) => {
  const handleChange = (value: string) => {
    setQueryParams("sortBy", value as SortOptions)
  }

  if (compact) {
    return (
      <label className="relative flex min-w-[190px] items-center">
        <span className="sr-only">Sắp xếp sản phẩm</span>
        <select
          value={sortBy}
          onChange={(event) => handleChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-3 pr-9 text-sm font-medium text-[var(--hp-ink)] focus:border-[var(--hp-accent)] focus:outline-none"
          data-testid={dataTestId}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownMini className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--hp-muted)]" />
      </label>
    )
  }

  return (
    <FilterRadioGroup
      title="Sắp xếp"
      items={sortOptions}
      value={sortBy}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default SortProducts
