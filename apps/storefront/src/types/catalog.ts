import { HttpTypes } from "@medusajs/types"

export type CatalogBrand = {
  id: string
  name: string
  handle: string
}

export type CatalogSpecification = {
  key: string
  label: string
  value: string
  unit?: string
  group?: string
  position: number
}

export type CatalogMerchandising = {
  categories?: Record<string, number>
  collections?: Record<string, number>
  homepage?: Record<string, number>
}

export type ProductCatalogProfile = {
  id: string
  model?: string | null
  brand?: CatalogBrand | null
  specifications?: { items?: CatalogSpecification[] } | null
  media_alt_text?: Record<string, string> | null
  merchandising?: CatalogMerchandising | null
}

export type CatalogProduct = HttpTypes.StoreProduct & {
  catalog?: ProductCatalogProfile | null
}

export const asCatalogProduct = (product: HttpTypes.StoreProduct) =>
  product as CatalogProduct
