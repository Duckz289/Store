import {
  CATALOG_BRANDS,
  CATALOG_CATEGORIES,
  CATALOG_COLLECTIONS,
  CATALOG_PRODUCTS,
  CATALOG_PRODUCT_TYPES,
  COLLECTION_PRODUCT_HANDLES,
  assertUniqueCatalogSkus,
} from "../catalog"

describe("catalog seed contract", () => {
  it("defines the required Product Types without duplicates", () => {
    expect(CATALOG_PRODUCT_TYPES).toEqual([
      "Điện thoại",
      "Laptop",
      "Phụ kiện",
      "Thiết bị mạng",
    ])
    expect(new Set(CATALOG_PRODUCT_TYPES).size).toBe(CATALOG_PRODUCT_TYPES.length)
  })

  it("keeps current category URLs stable and supports parent-ready categories", () => {
    expect(CATALOG_CATEGORIES.map((category) => category.handle)).toEqual([
      "điện-thoại",
      "laptop",
      "phụ-kiện",
      "thiết-bị-mạng",
    ])
    expect(CATALOG_CATEGORIES.every((category) => category.name && category.handle)).toBe(
      true
    )
  })

  it("validates every sellable variant SKU and collection membership", () => {
    expect(() => assertUniqueCatalogSkus()).not.toThrow()

    const skus = CATALOG_PRODUCTS.flatMap((product) =>
      product.variants.map((variant) => variant.sku)
    )
    expect(skus.every(Boolean)).toBe(true)
    expect(new Set(skus).size).toBe(skus.length)
    expect(CATALOG_COLLECTIONS.map((collection) => collection.handle)).toEqual([
      "flash-deal",
      "hang-moi",
      "uu-dai-noi-bat",
    ])
    expect(COLLECTION_PRODUCT_HANDLES["flash-deal"]).toEqual(
      CATALOG_PRODUCTS.map((product) => product.handle)
    )
  })

  it("keeps price data in VND and managed stock as seed inputs", () => {
    for (const product of CATALOG_PRODUCTS) {
      expect(product.type).toBeTruthy()
      expect(product.category).toBeTruthy()
      expect(product.brand).toBeTruthy()
      expect(product.model).toBeTruthy()
      expect(product.image).toMatch(/\.webp$/)
      expect(product.specifications.length).toBeGreaterThan(0)
      for (const variant of product.variants) {
        expect(variant.price).toBeGreaterThan(0)
        expect(variant.sku).toMatch(/^[A-Z0-9-]+$/)
      }
    }
  })

  it("defines stable unique Brand identities for product relationships", () => {
    const handles = CATALOG_BRANDS.map((brand) => brand.handle)
    expect(new Set(handles).size).toBe(handles.length)
    expect(
      CATALOG_PRODUCTS.every((product) => handles.includes(product.brand))
    ).toBe(true)
  })
})
