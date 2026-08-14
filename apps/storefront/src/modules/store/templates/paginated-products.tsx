import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import type {
  CatalogFacets,
  CatalogFilterSelection,
} from "@lib/util/catalog-filters"
import { HttpTypes } from "@medusajs/types"
import SalesProductCard from "@modules/home/components/sales-product-card"
import { Pagination } from "@modules/store/components/pagination"
import ProductListingControls from "@modules/store/components/product-listing-controls"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  q?: string
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  query,
  optionValueIds,
  categories,
  catalogFilters,
  catalogFacets,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  query?: string
  optionValueIds?: OptionValueIds
  categories?: HttpTypes.StoreProductCategory[]
  catalogFilters?: CatalogFilterSelection
  catalogFacets?: CatalogFacets
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (query?.trim()) {
    queryParams["q"] = query.trim()
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    optionValueIds,
    merchandisingContext: categoryId
      ? { kind: "categories", id: categoryId }
      : collectionId
      ? { kind: "collections", id: collectionId }
      : undefined,
    catalogFilters,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  if (!products.length) {
    return (
      <section className="rounded-[var(--hp-radius-card)] border border-dashed border-[var(--hp-line)] bg-[var(--hp-surface)] px-6 py-14 text-center" aria-live="polite">
        <h2 className="text-lg font-semibold text-[var(--hp-ink)]">Chưa tìm thấy sản phẩm phù hợp</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--hp-muted)]">
          Hãy xóa bớt bộ lọc hoặc thử từ khóa tìm kiếm khác.
        </p>
      </section>
    )
  }

  return (
    <>
      <ProductListingControls
        count={count}
        sortBy={sortBy || "created_at"}
        categories={categories}
        catalogFacets={catalogFacets}
      />
      <ul
        className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        data-testid="products-list"
      >
        {products.map((p) => {
          return (
            <li key={p.id}>
              <SalesProductCard product={p} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
