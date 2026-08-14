import { HttpTypes } from "@medusajs/types"

import { asCatalogProduct } from "types/catalog"

export const CATALOG_BRAND_QUERY_KEY = "brand"
export const CATALOG_SPEC_QUERY_KEY = "spec"
export const CATALOG_PRICE_QUERY_KEY = "price"

export type CatalogFilterSelection = {
  brands: string[]
  prices: string[]
  specifications: Record<string, string[]>
}

export type CatalogFacetValue = {
  value: string
  label: string
  count: number
  logoUrl?: string | null
}

export type CatalogFacetGroup = {
  key: string
  label: string
  group: string
  values: CatalogFacetValue[]
}

export type CatalogFacets = {
  brands: CatalogFacetValue[]
  prices: CatalogFacetValue[]
  specifications: CatalogFacetGroup[]
}

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

export function parseCatalogFilters(
  searchParams: SearchParamsLike,
): CatalogFilterSelection {
  const brands = getAll(searchParams, CATALOG_BRAND_QUERY_KEY)
  const specifications: Record<string, string[]> = {}

  for (const token of getAll(searchParams, CATALOG_SPEC_QUERY_KEY)) {
    const separatorIndex = token.indexOf(":")
    if (separatorIndex <= 0) continue
    const key = token.slice(0, separatorIndex)
    const value = token.slice(separatorIndex + 1)
    if (!key || !value) continue
    specifications[key] = Array.from(
      new Set([...(specifications[key] ?? []), value]),
    )
  }

  return {
    brands: Array.from(new Set(brands.filter(Boolean))),
    prices: Array.from(
      new Set(getAll(searchParams, CATALOG_PRICE_QUERY_KEY).filter(Boolean)),
    ),
    specifications,
  }
}

export function filterCatalogProducts(
  products: HttpTypes.StoreProduct[],
  selection?: CatalogFilterSelection,
) {
  if (!selection) return products
  const specificationEntries = Object.entries(selection.specifications)

  return products.filter((product) => {
    const catalog = asCatalogProduct(product).catalog
    if (
      selection.brands.length &&
      !selection.brands.includes(catalog?.brand?.handle ?? "")
    ) {
      return false
    }

    if (selection.prices.length) {
      const amounts = (product.variants ?? [])
        .map((variant) => variant.calculated_price?.calculated_amount)
        .filter((amount): amount is number => typeof amount === "number")
      const price = amounts.length ? Math.min(...amounts) : null
      if (
        price === null ||
        !selection.prices.some((handle) => priceMatchesRange(price, handle))
      ) {
        return false
      }
    }

    const specifications = new Map(
      (catalog?.specifications?.items ?? []).map((item) => [
        item.key,
        normalizeFacetValue(item.value, item.unit),
      ]),
    )

    return specificationEntries.every(([key, values]) => {
      if (!values.length) return true
      const productValue = specifications.get(key)
      return productValue ? values.includes(productValue) : false
    })
  })
}

export function buildCatalogFacets(products: HttpTypes.StoreProduct[]) {
  const brandCounts = new Map<string, CatalogFacetValue>()
  const specificationGroups = new Map<
    string,
    CatalogFacetGroup & { counts: Map<string, CatalogFacetValue> }
  >()
  const priceCounts = new Map(
    PRICE_RANGES.map((range) => [
      range.handle,
      { value: range.handle, label: range.label, count: 0 },
    ]),
  )

  for (const product of products) {
    const catalog = asCatalogProduct(product).catalog
    const brand = catalog?.brand
    const amounts = (product.variants ?? [])
      .map((variant) => variant.calculated_price?.calculated_amount)
      .filter((amount): amount is number => typeof amount === "number")
    const price = amounts.length ? Math.min(...amounts) : null
    if (price !== null) {
      for (const range of PRICE_RANGES) {
        if (!priceMatchesRange(price, range.handle)) continue
        const current = priceCounts.get(range.handle)
        if (current) current.count += 1
      }
    }
    if (brand?.handle) {
      const current = brandCounts.get(brand.handle)
      brandCounts.set(brand.handle, {
        value: brand.handle,
        label: brand.name,
        count: (current?.count ?? 0) + 1,
        logoUrl: brand.logo_url ?? current?.logoUrl ?? null,
      })
    }

    for (const specification of catalog?.specifications?.items ?? []) {
      if (specification.filterable === false || !specification.value) continue
      const value = normalizeFacetValue(specification.value, specification.unit)
      const currentGroup = specificationGroups.get(specification.key) ?? {
        key: specification.key,
        label: specification.label,
        group: displaySpecificationGroup(specification.key, specification.group),
        values: [],
        counts: new Map<string, CatalogFacetValue>(),
      }
      const currentValue = currentGroup.counts.get(value)
      currentGroup.counts.set(value, {
        value,
        label: value,
        count: (currentValue?.count ?? 0) + 1,
      })
      specificationGroups.set(specification.key, currentGroup)
    }
  }

  return {
    brands: sortFacetValues(Array.from(brandCounts.values())),
    prices: Array.from(priceCounts.values()).filter((range) => range.count > 0),
    specifications: Array.from(specificationGroups.values())
      .map(({ counts, ...group }) => ({
        ...group,
        values: sortFacetValues(Array.from(counts.values())).slice(0, 16),
      }))
      .filter(
        (group) =>
          group.values.length > 1 ||
          ["Cấu hình", "Nhu cầu sử dụng"].includes(group.group),
      )
      .sort((left, right) => left.label.localeCompare(right.label, "vi"))
      .slice(0, 10),
  } satisfies CatalogFacets
}

const PRICE_RANGES = [
  { handle: "under-1m", label: "Dưới 1 triệu", min: 0, max: 1_000_000 },
  { handle: "1m-3m", label: "1 - 3 triệu", min: 1_000_000, max: 3_000_000 },
  { handle: "3m-7m", label: "3 - 7 triệu", min: 3_000_000, max: 7_000_000 },
  { handle: "7m-15m", label: "7 - 15 triệu", min: 7_000_000, max: 15_000_000 },
  { handle: "above-15m", label: "Trên 15 triệu", min: 15_000_000, max: Infinity },
] as const

function priceMatchesRange(price: number, handle: string) {
  const range = PRICE_RANGES.find((item) => item.handle === handle)
  return range ? price >= range.min && price < range.max : false
}

export function catalogSpecToken(key: string, value: string) {
  return `${key}:${value}`
}

function normalizeFacetValue(value: string, unit?: string) {
  const normalized = value.trim()
  const normalizedUnit = unit?.trim()
  return normalizedUnit && !normalized.endsWith(normalizedUnit)
    ? `${normalized} ${normalizedUnit}`
    : normalized
}

function displaySpecificationGroup(key: string, group?: string) {
  if (group && group !== "Thông số") return group
  return CONFIGURATION_SPECIFICATION_KEYS.has(key) ? "Cấu hình" : "Thông số"
}

const CONFIGURATION_SPECIFICATION_KEYS = new Set([
  "cpu",
  "chipset",
  "ram",
  "ssd",
  "storage",
  "graphics",
  "display_size",
])

function sortFacetValues(values: CatalogFacetValue[]) {
  return values.sort(
    (left, right) =>
      right.count - left.count || left.label.localeCompare(right.label, "vi"),
  )
}

function getAll(searchParams: SearchParamsLike, key: string) {
  if (typeof (searchParams as URLSearchParams).getAll === "function") {
    return (searchParams as URLSearchParams).getAll(key)
  }
  const value = (
    searchParams as Record<string, string | string[] | undefined>
  )[key]
  if (Array.isArray(value)) return value
  return value ? [value] : []
}
