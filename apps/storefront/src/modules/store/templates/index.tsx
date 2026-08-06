import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  query,
  categoryId,
  optionValueIds,
  categories,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  query?: string
  categoryId?: string
  optionValueIds?: OptionValueIds
  categories?: HttpTypes.StoreProductCategory[]
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const heading = query ? `Kết quả cho “${query}”` : "Tất cả sản phẩm"

  return (
    <div className="content-container grid gap-6 py-6 lg:grid-cols-[244px_minmax(0,1fr)] lg:py-10" data-testid="category-container">
      <aside className="hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 lg:block">
        <RefinementList sortBy={sort} hideSort categories={categories} />
      </aside>
      <div className="min-w-0">
        <div className="mb-5">
          <p className="type-badge text-[var(--hp-accent)]">Khám phá thiết bị</p>
          <h1 className="type-section-title mt-2" data-testid="store-page-title">{heading}</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            query={query}
            categoryId={categoryId}
            optionValueIds={optionValueIds}
            categories={categories}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
