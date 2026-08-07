import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "merchandising"

  return (
    <div className="content-container grid gap-6 py-6 lg:grid-cols-[244px_minmax(0,1fr)] lg:py-10">
      <aside className="hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 lg:block">
        <RefinementList sortBy={sort} hideSort />
      </aside>
      <div className="min-w-0">
        <div className="mb-5">
          <p className="type-badge text-[var(--hp-accent)]">Bộ sưu tập</p>
          <h1 className="type-section-title mt-2">{collection.title}</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid numberOfProducts={collection.products?.length} />}>
          <PaginatedProducts sortBy={sort} page={pageNumber} collectionId={collection.id} countryCode={countryCode} optionValueIds={optionValueIds} />
        </Suspense>
      </div>
    </div>
  )
}
