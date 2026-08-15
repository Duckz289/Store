import { notFound } from "next/navigation"
import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import { listCatalogFacets } from "@lib/data/products"
import {
  EMPTY_CATALOG_FACETS,
  type CatalogFilterSelection,
} from "@lib/util/catalog-filters"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

/** The category itself plus every descendant, so parent pages show their subtree. */
function collectCategoryIds(
  category: HttpTypes.StoreProductCategory
): string[] {
  const ids = [category.id]
  for (const child of category.category_children ?? []) {
    ids.push(...collectCategoryIds(child))
  }
  return Array.from(new Set(ids))
}

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  catalogFilters,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  catalogFilters?: CatalogFilterSelection
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "merchandising"

  if (!category || !countryCode) notFound()

  const parents: HttpTypes.StoreProductCategory[] = []
  const getParents = (currentCategory: HttpTypes.StoreProductCategory) => {
    if (currentCategory.parent_category) {
      parents.push(currentCategory.parent_category)
      getParents(currentCategory.parent_category)
    }
  }
  getParents(category)

  // Stock hangs off leaf categories ("Nồi cơm điện"), so a parent page has to look
  // at its whole subtree or it would render as an empty category.
  const categoryIds = collectCategoryIds(category)

  const catalogFacets = await listCatalogFacets({
    countryCode,
    categoryIds,
  }).catch(() => EMPTY_CATALOG_FACETS)

  return (
    <div className="content-container grid gap-6 py-6 lg:grid-cols-[244px_minmax(0,1fr)] lg:py-10" data-testid="category-container">
      <aside className="hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 lg:block">
        <RefinementList
          sortBy={sort}
          data-testid="sort-by-container"
          hideSort
          catalogFacets={catalogFacets}
        />
      </aside>
      <div className="min-w-0">
        <div className="mb-5">
          {parents.length > 0 && (
            <nav className="mb-2 flex flex-wrap gap-2 text-sm text-[var(--hp-muted)]" aria-label="Danh mục cha">
              {parents.reverse().map((parent) => (
                <LocalizedClientLink key={parent.id} className="hover:text-[var(--hp-accent)]" href={`/categories/${parent.handle}`}>
                  {parent.name}
                </LocalizedClientLink>
              ))}
            </nav>
          )}
          <p className="type-badge text-[var(--hp-accent)]">Danh mục</p>
          <h1 className="type-section-title mt-2" data-testid="category-page-title">{category.name}</h1>
          {category.description && <p className="type-body mt-3 text-[var(--hp-muted)]">{category.description}</p>}
        </div>

        {category.category_children?.length ? (
          <ul className="mb-5 flex gap-2 overflow-x-auto pb-1">
            {category.category_children.map((child) => (
              <li key={child.id} className="shrink-0">
                <LocalizedClientLink className="inline-flex h-9 items-center rounded-[var(--hp-radius-pill)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-3 text-sm font-medium text-[var(--hp-ink)] hover:border-[var(--hp-accent)] hover:text-[var(--hp-accent)]" href={`/categories/${child.handle}`}>
                  {child.name}
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
        ) : null}

        <Suspense fallback={<SkeletonProductGrid numberOfProducts={category.products?.length ?? 8} />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            categoryIds={categoryIds}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
            catalogFilters={catalogFilters}
            catalogFacets={catalogFacets}
          />
        </Suspense>
      </div>
    </div>
  )
}
