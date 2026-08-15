"use server"

import {
  CATALOG_PRICE_RANGES,
  lowestPrice,
} from "@lib/util/catalog-filters"
import { asCatalogProduct } from "types/catalog"

import { listProducts } from "./products"

export type CatalogNavigationBrand = {
  name: string
  handle: string
  count: number
  logoUrl?: string | null
  logoAlt?: string | null
}

export type CatalogNavigationChip = {
  value: string
  label: string
  count: number
}

export type CatalogNavigationProduct = {
  id: string
  title: string
  handle: string
  price: number | null
  brandName?: string | null
  brandLogoUrl?: string | null
}

export type CatalogNavigationGroup = {
  categoryId: string
  brands: CatalogNavigationBrand[]
  products: CatalogNavigationProduct[]
  /** Price bands that actually contain stock in this category. */
  priceBands: CatalogNavigationChip[]
  /** Structured "Nhu cầu sử dụng" values, e.g. Văn phòng, Gaming, Nấu ăn hằng ngày. */
  useCases: CatalogNavigationChip[]
  /** Device kinds drawn from the catalog specs, e.g. Nồi cơm điện tử. */
  deviceTypes: CatalogNavigationChip[]
}

const USE_CASE_SPEC_KEY = "purpose"
const DEVICE_TYPE_SPEC_KEYS = ["appliance_type", "device_type", "network_type", "accessory_type"]

export const getCatalogNavigation = async (countryCode: string) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit: 200 },
  })

  type Accumulator = {
    categoryId: string
    brands: Map<string, CatalogNavigationBrand>
    products: CatalogNavigationProduct[]
    priceBands: Map<string, CatalogNavigationChip>
    useCases: Map<string, CatalogNavigationChip>
    deviceTypes: Map<string, CatalogNavigationChip>
  }

  const groups = new Map<string, Accumulator>()

  for (const product of products) {
    const catalog = asCatalogProduct(product).catalog
    const price = lowestPrice(product)
    const specifications = catalog?.specifications?.items ?? []

    for (const category of product.categories ?? []) {
      const group: Accumulator = groups.get(category.id) ?? {
        categoryId: category.id,
        brands: new Map(),
        products: [],
        priceBands: new Map(),
        useCases: new Map(),
        deviceTypes: new Map(),
      }

      if (group.products.length < 8) {
        group.products.push({
          id: product.id,
          title: product.title,
          handle: product.handle,
          price,
          brandName: catalog?.brand?.name ?? null,
          brandLogoUrl: catalog?.brand?.logo_url ?? null,
        })
      }

      if (catalog?.brand?.handle) {
        const brand = catalog.brand
        const current = group.brands.get(brand.handle)
        group.brands.set(brand.handle, {
          name: brand.name,
          handle: brand.handle,
          count: (current?.count ?? 0) + 1,
          logoUrl: brand.logo_url ?? current?.logoUrl ?? null,
          logoAlt: brand.logo_alt ?? current?.logoAlt ?? null,
        })
      }

      if (price !== null) {
        const range = CATALOG_PRICE_RANGES.find(
          (candidate) => price >= candidate.min && price < candidate.max
        )
        if (range) {
          const current = group.priceBands.get(range.handle)
          group.priceBands.set(range.handle, {
            value: range.handle,
            label: range.label,
            count: (current?.count ?? 0) + 1,
          })
        }
      }

      for (const specification of specifications) {
        if (!specification.value) continue

        if (specification.key === USE_CASE_SPEC_KEY) {
          for (const value of specification.value.split(",")) {
            const label = value.trim()
            if (!label) continue
            const current = group.useCases.get(label)
            group.useCases.set(label, {
              value: label,
              label,
              count: (current?.count ?? 0) + 1,
            })
          }
          continue
        }

        if (DEVICE_TYPE_SPEC_KEYS.includes(specification.key)) {
          const label = specification.value.trim()
          if (!label) continue
          const current = group.deviceTypes.get(label)
          group.deviceTypes.set(label, {
            value: label,
            label,
            count: (current?.count ?? 0) + 1,
          })
        }
      }

      groups.set(category.id, group)
    }
  }

  return Array.from(groups.values()).map((group) => ({
    categoryId: group.categoryId,
    products: group.products,
    brands: sortByCount(
      Array.from(group.brands.values()),
      (brand) => brand.name
    ),
    // Price bands read low to high, not by popularity.
    priceBands: CATALOG_PRICE_RANGES.map((range) =>
      group.priceBands.get(range.handle)
    ).filter((band): band is CatalogNavigationChip => Boolean(band)),
    useCases: sortByCount(Array.from(group.useCases.values())),
    deviceTypes: sortByCount(Array.from(group.deviceTypes.values())),
  })) satisfies CatalogNavigationGroup[]
}

function sortByCount<T extends { count: number }>(
  values: T[],
  labelOf: (value: T) => string = (value) => (value as { label?: string }).label ?? ""
) {
  return values.sort(
    (left, right) =>
      right.count - left.count ||
      labelOf(left).localeCompare(labelOf(right), "vi")
  )
}
