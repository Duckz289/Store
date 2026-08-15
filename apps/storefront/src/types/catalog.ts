import { HttpTypes } from "@medusajs/types"

export type CatalogBrandKind = "manufacturer" | "store_label" | "unspecified"

export type CatalogBrand = {
  id: string
  name: string
  handle: string
  kind?: CatalogBrandKind | null
  logo_url?: string | null
  logo_alt?: string | null
}

export type CatalogSpecification = {
  key: string
  label: string
  value: string
  unit?: string
  group?: string
  filterable?: boolean
  featured?: boolean
  /** The value holds several comma-separated entries, each its own facet chip. */
  multi?: boolean
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

/** A brand may only appear in a logo row when it actually has a logo to show. */
export const hasBrandLogo = (
  brand?: Pick<CatalogBrand, "logo_url"> | null
): brand is CatalogBrand & { logo_url: string } =>
  Boolean(brand?.logo_url && brand.logo_url.trim())

export const brandLogoAlt = (brand: Pick<CatalogBrand, "name" | "logo_alt">) =>
  brand.logo_alt?.trim() || `Logo ${brand.name}`
