import { Metadata } from "next"

import { listCategories } from "@lib/data/categories"
import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { parseCatalogFilters } from "@lib/util/catalog-filters"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Sản phẩm",
  description: "Khám phá các thiết bị điện tử đang được phân phối.",
}

type StorePageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  q?: string
  category_id?: string
  optionValueIds?: string | string[]
}

type Params = {
  searchParams: Promise<StorePageSearchParams>
  params: Promise<{ countryCode: string }>
}

export default async function StorePage(props: Params) {
  const [params, searchParams, categories] = await Promise.all([
    props.params,
    props.searchParams,
    listCategories().catch(() => []),
  ])
  const { sortBy, page, q, category_id: categoryId } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)
  const catalogFilters = parseCatalogFilters(searchParams)

  return <StoreTemplate sortBy={sortBy} page={page} countryCode={params.countryCode} query={q} categoryId={categoryId} optionValueIds={optionValueIds} categories={categories} catalogFilters={catalogFilters} />
}
