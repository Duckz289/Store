"use server"

import { asCatalogProduct } from "types/catalog"

import { listProducts } from "./products"

export type CatalogNavigationGroup = {
  categoryId: string
  brands: { name: string; handle: string; count: number }[]
  products: { id: string; title: string; handle: string }[]
}

export const getCatalogNavigation = async (countryCode: string) => {
  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit: 100 },
  })
  const groups = new Map<
    string,
    {
      categoryId: string
      brandCounts: Map<string, { name: string; handle: string; count: number }>
      products: { id: string; title: string; handle: string }[]
    }
  >()

  for (const product of products) {
    const catalog = asCatalogProduct(product).catalog
    for (const category of product.categories ?? []) {
      const group = groups.get(category.id) ?? {
        categoryId: category.id,
        brandCounts: new Map(),
        products: [] as { id: string; title: string; handle: string }[],
      }
      if (group.products.length < 8) {
        group.products.push({
          id: product.id,
          title: product.title,
          handle: product.handle,
        })
      }
      if (catalog?.brand?.handle) {
        const current = group.brandCounts.get(catalog.brand.handle)
        group.brandCounts.set(catalog.brand.handle, {
          name: catalog.brand.name,
          handle: catalog.brand.handle,
          count: (current?.count ?? 0) + 1,
        })
      }
      groups.set(category.id, group)
    }
  }

  return Array.from(groups.values()).map(({ brandCounts, ...group }) => ({
    ...group,
    brands: Array.from(brandCounts.values()).sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name, "vi"),
    ),
  })) satisfies CatalogNavigationGroup[]
}
