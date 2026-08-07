export type CatalogBrand = {
  id: string
  name: string
  handle: string
}

export type CatalogSpecification = {
  key: string
  label: string
  value: string
  unit: string
  group: string
  position: number
}

export type ProductCatalogProfile = {
  id: string
  model?: string | null
  brand?: CatalogBrand | null
  specifications?: { items?: CatalogSpecification[] } | null
  media_alt_text?: Record<string, string> | null
  merchandising?: {
    categories?: Record<string, number>
    collections?: Record<string, number>
    homepage?: Record<string, number>
  } | null
}

export type ProductCatalogResponse = {
  product: {
    id: string
    title: string
    handle: string
    status: string
    thumbnail?: string | null
    images?: Array<{ id: string; url: string }>
    categories?: Array<{ id: string; name: string }>
    collection?: { id: string; title: string } | null
  }
  catalog: ProductCatalogProfile | null
}
