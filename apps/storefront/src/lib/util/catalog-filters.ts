import { HttpTypes } from "@medusajs/types"

import { asCatalogProduct, CatalogSpecification } from "types/catalog"

export const CATALOG_BRAND_QUERY_KEY = "brand"
export const CATALOG_SPEC_QUERY_KEY = "spec"
export const CATALOG_PRICE_QUERY_KEY = "price"
export const CATALOG_CATEGORY_QUERY_KEY = "sub"
export const CATALOG_AVAILABILITY_QUERY_KEY = "stock"

export const CATALOG_FILTER_QUERY_KEYS = [
  CATALOG_BRAND_QUERY_KEY,
  CATALOG_SPEC_QUERY_KEY,
  CATALOG_PRICE_QUERY_KEY,
  CATALOG_CATEGORY_QUERY_KEY,
  CATALOG_AVAILABILITY_QUERY_KEY,
] as const

export type CatalogFilterSelection = {
  brands: string[]
  prices: string[]
  categories: string[]
  availability: string[]
  specifications: Record<string, string[]>
}

export type CatalogFacetValue = {
  value: string
  label: string
  count: number
  logoUrl?: string | null
  logoAlt?: string | null
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
  categories: CatalogFacetValue[]
  availability: CatalogFacetValue[]
  specifications: CatalogFacetGroup[]
}

export const EMPTY_CATALOG_FACETS: CatalogFacets = {
  brands: [],
  prices: [],
  categories: [],
  availability: [],
  specifications: [],
}

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

/**
 * Price bands in VND. Every band is half-open [min, max) so a product lands in
 * exactly one, and the labels read the way shoppers say them out loud.
 */
export const CATALOG_PRICE_RANGES = [
  { handle: "under-500k", label: "Dưới 500K", min: 0, max: 500_000 },
  { handle: "500k-1m", label: "500K - 1 triệu", min: 500_000, max: 1_000_000 },
  { handle: "1m-3m", label: "1 - 3 triệu", min: 1_000_000, max: 3_000_000 },
  { handle: "3m-7m", label: "3 - 7 triệu", min: 3_000_000, max: 7_000_000 },
  { handle: "7m-15m", label: "7 - 15 triệu", min: 7_000_000, max: 15_000_000 },
  {
    handle: "above-15m",
    label: "Trên 15 triệu",
    min: 15_000_000,
    max: Number.POSITIVE_INFINITY,
  },
] as const

export const CATALOG_AVAILABILITY_OPTIONS = [
  { handle: "in-stock", label: "Còn hàng" },
  { handle: "on-sale", label: "Đang giảm giá" },
] as const

export const CATALOG_SPEC_GROUP_ORDER = [
  "Nhu cầu sử dụng",
  "Cấu hình",
  "Sản phẩm",
  "Hiển thị",
  "Màn hình",
  "Kết nối",
  "Tính năng",
  "Vận hành",
  "Lắp đặt",
  "Tương thích",
  "Kích thước",
]

export function parseCatalogFilters(
  searchParams: SearchParamsLike
): CatalogFilterSelection {
  const specifications: Record<string, string[]> = {}

  for (const token of getAll(searchParams, CATALOG_SPEC_QUERY_KEY)) {
    const separatorIndex = token.indexOf(":")
    if (separatorIndex <= 0) continue
    const key = token.slice(0, separatorIndex)
    const value = token.slice(separatorIndex + 1)
    if (!key || !value) continue
    specifications[key] = Array.from(
      new Set([...(specifications[key] ?? []), value])
    )
  }

  return {
    brands: uniqueValues(searchParams, CATALOG_BRAND_QUERY_KEY),
    prices: uniqueValues(searchParams, CATALOG_PRICE_QUERY_KEY),
    categories: uniqueValues(searchParams, CATALOG_CATEGORY_QUERY_KEY),
    availability: uniqueValues(searchParams, CATALOG_AVAILABILITY_QUERY_KEY),
    specifications,
  }
}

export function isCatalogFilterActive(selection?: CatalogFilterSelection) {
  if (!selection) return false
  return Boolean(
    selection.brands.length ||
      selection.prices.length ||
      selection.categories.length ||
      selection.availability.length ||
      Object.values(selection.specifications).some((values) => values.length)
  )
}

export function countActiveCatalogFilters(selection?: CatalogFilterSelection) {
  if (!selection) return 0
  return (
    selection.brands.length +
    selection.prices.length +
    selection.categories.length +
    selection.availability.length +
    Object.values(selection.specifications).reduce(
      (total, values) => total + values.length,
      0
    )
  )
}

export function filterCatalogProducts(
  products: HttpTypes.StoreProduct[],
  selection?: CatalogFilterSelection
) {
  if (!selection) return products
  const specificationEntries = Object.entries(selection.specifications).filter(
    ([, values]) => values.length
  )

  return products.filter((product) => {
    const catalog = asCatalogProduct(product).catalog

    if (
      selection.brands.length &&
      !selection.brands.includes(catalog?.brand?.handle ?? "")
    ) {
      return false
    }

    if (selection.categories.length) {
      const categoryHandles = (product.categories ?? []).map(
        (category) => category.handle
      )
      if (!selection.categories.some((handle) => categoryHandles.includes(handle))) {
        return false
      }
    }

    if (selection.prices.length) {
      const price = lowestPrice(product)
      if (
        price === null ||
        !selection.prices.some((handle) => priceMatchesRange(price, handle))
      ) {
        return false
      }
    }

    if (selection.availability.length) {
      const matchesEvery = selection.availability.every((handle) =>
        handle === "in-stock"
          ? isInStock(product)
          : handle === "on-sale"
          ? isOnSale(product)
          : true
      )
      if (!matchesEvery) return false
    }

    if (!specificationEntries.length) return true

    const specificationValues = specificationMap(catalog?.specifications?.items)

    return specificationEntries.every(([key, values]) => {
      const productValues = specificationValues.get(key)
      if (!productValues) return false
      return values.some((value) => productValues.includes(value))
    })
  })
}

export function buildCatalogFacets(
  products: HttpTypes.StoreProduct[]
): CatalogFacets {
  const brandCounts = new Map<string, CatalogFacetValue>()
  const categoryCounts = new Map<string, CatalogFacetValue>()
  const specificationGroups = new Map<
    string,
    CatalogFacetGroup & { counts: Map<string, CatalogFacetValue> }
  >()
  const priceCounts = new Map(
    CATALOG_PRICE_RANGES.map((range) => [
      range.handle,
      { value: range.handle, label: range.label, count: 0 },
    ])
  )
  const availabilityCounts = new Map(
    CATALOG_AVAILABILITY_OPTIONS.map((option) => [
      option.handle,
      { value: option.handle, label: option.label, count: 0 },
    ])
  )

  for (const product of products) {
    const catalog = asCatalogProduct(product).catalog
    const brand = catalog?.brand

    const price = lowestPrice(product)
    if (price !== null) {
      const range = CATALOG_PRICE_RANGES.find((candidate) =>
        priceMatchesRange(price, candidate.handle)
      )
      const current = range ? priceCounts.get(range.handle) : undefined
      if (current) current.count += 1
    }

    if (isInStock(product)) {
      const current = availabilityCounts.get("in-stock")
      if (current) current.count += 1
    }
    if (isOnSale(product)) {
      const current = availabilityCounts.get("on-sale")
      if (current) current.count += 1
    }

    if (brand?.handle) {
      const current = brandCounts.get(brand.handle)
      brandCounts.set(brand.handle, {
        value: brand.handle,
        label: brand.name,
        count: (current?.count ?? 0) + 1,
        logoUrl: brand.logo_url ?? current?.logoUrl ?? null,
        logoAlt: brand.logo_alt ?? current?.logoAlt ?? null,
      })
    }

    for (const category of product.categories ?? []) {
      if (!category.handle) continue
      const current = categoryCounts.get(category.handle)
      categoryCounts.set(category.handle, {
        value: category.handle,
        label: category.name,
        count: (current?.count ?? 0) + 1,
      })
    }

    for (const specification of catalog?.specifications?.items ?? []) {
      if (specification.filterable === false || !specification.value) continue
      const values = splitSpecificationValue(specification)
      if (!values.length) continue

      const currentGroup = specificationGroups.get(specification.key) ?? {
        key: specification.key,
        label: specification.label,
        group: displaySpecificationGroup(specification.key, specification.group),
        values: [],
        counts: new Map<string, CatalogFacetValue>(),
      }
      for (const value of values) {
        const currentValue = currentGroup.counts.get(value)
        currentGroup.counts.set(value, {
          value,
          label: value,
          count: (currentValue?.count ?? 0) + 1,
        })
      }
      specificationGroups.set(specification.key, currentGroup)
    }
  }

  return {
    brands: sortFacetValues(Array.from(brandCounts.values())),
    // A lone subcategory chip filters nothing the page is not already showing.
    categories:
      categoryCounts.size > 1
        ? sortFacetValues(Array.from(categoryCounts.values()))
        : [],
    prices: Array.from(priceCounts.values()).filter((range) => range.count > 0),
    availability: Array.from(availabilityCounts.values()).filter(
      (option) => option.count > 0
    ),
    specifications: Array.from(specificationGroups.values())
      .map(({ counts, ...group }) => ({
        ...group,
        values: sortFacetValues(Array.from(counts.values())).slice(0, 16),
      }))
      // A facet with a single value cannot narrow anything, so it is noise.
      .filter((group) => group.values.length > 1)
      .sort(compareSpecificationGroups)
      .slice(0, 12),
  }
}

/** Human-readable summary of what is currently selected, for the active chips row. */
export function describeCatalogSelection(
  selection: CatalogFilterSelection,
  facets: CatalogFacets
) {
  const chips: { key: string; queryKey: string; value: string; label: string }[] = []

  for (const handle of selection.brands) {
    const facet = facets.brands.find((item) => item.value === handle)
    chips.push({
      key: `brand:${handle}`,
      queryKey: CATALOG_BRAND_QUERY_KEY,
      value: handle,
      label: facet?.label ?? handle,
    })
  }
  for (const handle of selection.categories) {
    const facet = facets.categories.find((item) => item.value === handle)
    chips.push({
      key: `sub:${handle}`,
      queryKey: CATALOG_CATEGORY_QUERY_KEY,
      value: handle,
      label: facet?.label ?? handle,
    })
  }
  for (const handle of selection.prices) {
    const range = CATALOG_PRICE_RANGES.find((item) => item.handle === handle)
    chips.push({
      key: `price:${handle}`,
      queryKey: CATALOG_PRICE_QUERY_KEY,
      value: handle,
      label: range?.label ?? handle,
    })
  }
  for (const handle of selection.availability) {
    const option = CATALOG_AVAILABILITY_OPTIONS.find(
      (item) => item.handle === handle
    )
    chips.push({
      key: `stock:${handle}`,
      queryKey: CATALOG_AVAILABILITY_QUERY_KEY,
      value: handle,
      label: option?.label ?? handle,
    })
  }
  for (const [specKey, values] of Object.entries(selection.specifications)) {
    for (const value of values) {
      chips.push({
        key: `spec:${specKey}:${value}`,
        queryKey: CATALOG_SPEC_QUERY_KEY,
        value: catalogSpecToken(specKey, value),
        label: value,
      })
    }
  }

  return chips
}

export function catalogSpecToken(key: string, value: string) {
  return `${key}:${value}`
}

export function formatPriceRangeLabel(handle: string) {
  return CATALOG_PRICE_RANGES.find((range) => range.handle === handle)?.label ?? handle
}

function priceMatchesRange(price: number, handle: string) {
  const range = CATALOG_PRICE_RANGES.find((item) => item.handle === handle)
  return range ? price >= range.min && price < range.max : false
}

export function lowestPrice(product: HttpTypes.StoreProduct) {
  const amounts = (product.variants ?? [])
    .map((variant) => variant.calculated_price?.calculated_amount)
    .filter((amount): amount is number => typeof amount === "number")
  return amounts.length ? Math.min(...amounts) : null
}

function isInStock(product: HttpTypes.StoreProduct) {
  return (product.variants ?? []).some((variant) => {
    if (variant.allow_backorder) return true
    if (variant.manage_inventory === false) return true
    return (variant.inventory_quantity ?? 0) > 0
  })
}

function isOnSale(product: HttpTypes.StoreProduct) {
  return (product.variants ?? []).some((variant) => {
    const price = variant.calculated_price
    if (!price) return false
    const original = price.original_amount
    const calculated = price.calculated_amount
    return (
      typeof original === "number" &&
      typeof calculated === "number" &&
      original > calculated
    )
  })
}

function specificationMap(items?: CatalogSpecification[]) {
  const map = new Map<string, string[]>()
  for (const item of items ?? []) {
    map.set(item.key, splitSpecificationValue(item))
  }
  return map
}

function splitSpecificationValue(specification: CatalogSpecification) {
  const withUnit = (value: string) =>
    normalizeFacetValue(value, specification.unit)

  if (!specification.multi) {
    const single = withUnit(specification.value)
    return single ? [single] : []
  }

  return Array.from(
    new Set(
      specification.value
        .split(",")
        .map((part) => withUnit(part))
        .filter(Boolean)
    )
  )
}

function normalizeFacetValue(value: string, unit?: string) {
  const normalized = value.trim()
  if (!normalized) return ""
  const normalizedUnit = unit?.trim()
  return normalizedUnit && !normalized.endsWith(normalizedUnit)
    ? `${normalized} ${normalizedUnit}`
    : normalized
}

function displaySpecificationGroup(key: string, group?: string) {
  if (group && !["Thông số", "general"].includes(group)) return group
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
  "screen_size",
])

function compareSpecificationGroups(
  left: CatalogFacetGroup,
  right: CatalogFacetGroup
) {
  const leftRank = CATALOG_SPEC_GROUP_ORDER.indexOf(left.group)
  const rightRank = CATALOG_SPEC_GROUP_ORDER.indexOf(right.group)
  const leftOrder = leftRank === -1 ? CATALOG_SPEC_GROUP_ORDER.length : leftRank
  const rightOrder = rightRank === -1 ? CATALOG_SPEC_GROUP_ORDER.length : rightRank
  return (
    leftOrder - rightOrder || left.label.localeCompare(right.label, "vi")
  )
}

function sortFacetValues(values: CatalogFacetValue[]) {
  return values.sort(
    (left, right) =>
      right.count - left.count || left.label.localeCompare(right.label, "vi")
  )
}

function uniqueValues(searchParams: SearchParamsLike, key: string) {
  return Array.from(new Set(getAll(searchParams, key).filter(Boolean)))
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
