"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import {
  buildCatalogFacets,
  CatalogFilterSelection,
  filterCatalogProducts,
} from "@lib/util/catalog-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { asCatalogProduct } from "types/catalog"
import { listCategories } from "./categories"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
    revalidate: 30,
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.inventory_items.inventory.location_levels,*variants.images,*variants.options,+metadata,+tags,*categories,*collection,*type,+catalog.*,+catalog.brand.*",
          ...queryParams,
        },
        headers,
        next,
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

export type SearchCatalogProductSuggestion = {
  id: string
  handle: string
  title: string
  thumbnail?: string | null
  brand?: string | null
  model?: string | null
  price?: number | null
  currencyCode?: string | null
}

export type SearchCatalogResult = {
  products: SearchCatalogProductSuggestion[]
  categories: { id: string; name: string; handle: string }[]
  brands: { name: string; handle: string }[]
}

export const searchCatalog = async ({
  countryCode,
  query,
}: {
  countryCode: string
  query: string
}): Promise<SearchCatalogResult> => {
  const trimmedQuery = query.trim()

  if (trimmedQuery.length < 2) {
    return { products: [], categories: [], brands: [] }
  }

  const [productResponse, categories] = await Promise.all([
    listProducts({ countryCode, queryParams: { limit: 100 } }),
    listCategories().catch(() => []),
  ])
  const normalizedQuery = normalizeSearchText(trimmedQuery)
  const products = productResponse.response.products
    .map((product) => ({ product, score: scoreProduct(product, normalizedQuery) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map(({ product }) => {
      const catalog = asCatalogProduct(product).catalog
      const price = product.variants?.[0]?.calculated_price
      return {
        id: product.id,
        handle: product.handle,
        title: product.title,
        thumbnail: product.thumbnail,
        brand: catalog?.brand?.name,
        model: catalog?.model,
        price: price?.calculated_amount,
        currencyCode: price?.currency_code,
      }
    })

  const matchedCategories = categories
    .filter((category) =>
      normalizeSearchText(`${category.name} ${category.handle}`).includes(
        normalizedQuery,
      ),
    )
    .slice(0, 5)
    .map(({ id, name, handle }) => ({ id, name, handle }))

  const matchedBrands = Array.from(
    new Map(
      productResponse.response.products
        .map((product) => asCatalogProduct(product).catalog?.brand)
        .filter((brand): brand is NonNullable<typeof brand> => Boolean(brand))
        .filter((brand) =>
          normalizeSearchText(`${brand.name} ${brand.handle}`).includes(
            normalizedQuery,
          ),
        )
        .map((brand) => [brand.handle, { name: brand.name, handle: brand.handle }]),
    ).values(),
  ).slice(0, 5)

  return {
    products,
    categories: matchedCategories,
    brands: matchedBrands,
  }
}

function scoreProduct(product: HttpTypes.StoreProduct, query: string) {
  const catalog = asCatalogProduct(product).catalog
  const title = normalizeSearchText(product.title)
  const handle = normalizeSearchText(product.handle)
  const brand = normalizeSearchText(catalog?.brand?.name ?? "")
  const model = normalizeSearchText(catalog?.model ?? "")
  const specifications = normalizeSearchText(
    (catalog?.specifications?.items ?? [])
      .map((item) => `${item.label} ${item.value} ${item.unit ?? ""}`)
      .join(" "),
  )
  const skus = normalizeSearchText(
    (product.variants ?? []).map((variant) => variant.sku ?? "").join(" "),
  )

  if (title === query || model === query || skus === query) return 120
  if (title.startsWith(query)) return 100
  if (title.includes(query)) return 90
  if (brand.includes(query)) return 80
  if (model.includes(query) || skus.includes(query)) return 70
  if (handle.includes(query) || specifications.includes(query)) return 50
  return 0
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
  merchandisingContext,
  catalogFilters,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
  merchandisingContext?: {
    kind: "categories" | "collections" | "homepage"
    id: string
  }
  catalogFilters?: CatalogFilterSelection
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = queryParams?.limit || 12
  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )

  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
      limit: 100,
    },
    countryCode,
  })

  const catalogFilteredProducts = filterCatalogProducts(products, catalogFilters)
  const sortedProducts = sortProducts(
    catalogFilteredProducts,
    sortBy,
    merchandisingContext,
  )

  const pageParam = (page - 1) * limit

  const filteredCount = catalogFilteredProducts.length

  const nextPage = filteredCount > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count: filteredCount,
    },
    nextPage,
    queryParams,
  }
}

export const listCatalogFacets = async ({
  countryCode,
  categoryId,
  query,
}: {
  countryCode: string
  categoryId?: string
  query?: string
}) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      limit: 100,
      ...(categoryId ? { category_id: [categoryId] } : {}),
      ...(query?.trim() ? { q: query.trim() } : {}),
    },
  })

  return buildCatalogFacets(products)
}
