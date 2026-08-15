import {
  CATALOG_BRANDS,
  CATALOG_CATEGORIES,
  CATALOG_COLLECTIONS,
  CATALOG_PRODUCTS,
  CATALOG_PRODUCT_TYPES,
  COLLECTION_PRODUCT_HANDLES,
  RETIRED_DEMO_BRAND_HANDLES,
  assertCatalogBrandReferences,
  assertUniqueCatalogSkus,
} from "../catalog"

describe("catalog seed contract", () => {
  it("defines the required Product Types without duplicates", () => {
    expect(CATALOG_PRODUCT_TYPES).toEqual([
      "Laptop",
      "Phụ kiện",
      "Thiết bị mạng",
      "Đồ gia dụng",
      "Điện lạnh",
      "Thiết bị điện",
      "Âm thanh & TV",
    ])
    expect(new Set(CATALOG_PRODUCT_TYPES).size).toBe(CATALOG_PRODUCT_TYPES.length)
  })

  it("uses ASCII category handles so storefront URLs stay readable", () => {
    const handles = CATALOG_CATEGORIES.map((category) => category.handle)
    expect(handles).toEqual(
      expect.arrayContaining([
        "laptop",
        "phu-kien",
        "thiet-bi-mang",
        "do-gia-dung",
        "dien-lanh",
        "thiet-bi-dien",
        "am-thanh-tv",
      ])
    )
    for (const handle of handles) {
      expect(handle).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
    expect(new Set(handles).size).toBe(handles.length)
  })

  it("declares every parent category before its children", () => {
    expect(
      CATALOG_CATEGORIES.every(
        (category, index) =>
          !category.parent ||
          CATALOG_CATEGORIES.findIndex(
            (candidate) => candidate.name === category.parent
          ) < index
      )
    ).toBe(true)
    expect(
      CATALOG_CATEGORIES.every((category) => category.name && category.handle)
    ).toBe(true)
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

  it("sells no phones and keeps invented demo brands out of the catalog", () => {
    const handles = CATALOG_PRODUCTS.map((product) => String(product.handle))
    expect(handles).not.toContain("dien-thoai-nova-x1")
    expect(handles.some((handle) => handle.startsWith("dien-thoai"))).toBe(false)

    const brandHandles = CATALOG_BRANDS.map((brand) => brand.handle)
    for (const retired of RETIRED_DEMO_BRAND_HANDLES) {
      expect(brandHandles).not.toContain(retired)
    }
  })

  it("keeps price data in VND and managed stock as seed inputs", () => {
    for (const product of CATALOG_PRODUCTS) {
      expect(product.type).toBeTruthy()
      expect(product.category).toBeTruthy()
      expect(product.brand).toBeTruthy()
      expect(product.model).toBeTruthy()
      expect(product.weight).toBeGreaterThan(0)
      expect(product.specifications.length).toBeGreaterThan(0)
      for (const variant of product.variants) {
        expect(variant.price).toBeGreaterThan(0)
        expect(variant.sku).toMatch(/^[A-Z0-9-]+$/)
      }
    }
  })

  it("maps every catalog product to a local product image", () => {
    for (const product of CATALOG_PRODUCTS) {
      expect(product.image).toMatch(/^[a-z0-9-]+\.(webp|png|jpg)$/)
    }
  })

  it("numbers specifications from zero within each product", () => {
    for (const product of CATALOG_PRODUCTS) {
      expect(product.specifications.map((item) => item.position)).toEqual(
        product.specifications.map((_, index) => index)
      )
      expect(new Set(product.specifications.map((item) => item.key)).size).toBe(
        product.specifications.length
      )
    }
  })

  it("marks seeded sample rows so staff never mistake them for counted stock", () => {
    const demo = CATALOG_PRODUCTS.filter(
      (product) => product.dataSource === "demo_fixture"
    )
    expect(demo.length).toBeGreaterThan(0)
    for (const product of CATALOG_PRODUCTS) {
      expect(["real", "demo_fixture"]).toContain(product.dataSource)
    }
  })

  it("defines stable unique Brand identities for product relationships", () => {
    const handles = CATALOG_BRANDS.map((brand) => brand.handle)
    expect(new Set(handles).size).toBe(handles.length)
    expect(() => assertCatalogBrandReferences()).not.toThrow()
    expect(
      CATALOG_PRODUCTS.every((product) => handles.includes(product.brand))
    ).toBe(true)
  })

  it("separates the store label and unknown-brand rows from real manufacturers", () => {
    const byHandle = new Map(CATALOG_BRANDS.map((brand) => [brand.handle, brand]))

    expect(byHandle.get("hung-phat")?.kind).toBe("store_label")
    expect(byHandle.get("khong-ro-thuong-hieu")?.kind).toBe("unspecified")
    expect(byHandle.get("samsung")?.kind).toBe("manufacturer")

    // A store label is not a hardware maker, so it never carries a maker's logo.
    expect(byHandle.get("hung-phat")?.logo).toBeUndefined()
    expect(byHandle.get("khong-ro-thuong-hieu")?.logo).toBeUndefined()

    // Nothing is auto-assigned to the unknown-brand row; staff pick it explicitly.
    expect(
      CATALOG_PRODUCTS.some((product) => product.brand === "khong-ro-thuong-hieu")
    ).toBe(false)
  })

  it("points every declared brand logo at an svg asset filename", () => {
    for (const brand of CATALOG_BRANDS) {
      if (!brand.logo) continue
      expect(brand.logo).toMatch(/^[a-z0-9-]+\.svg$/)
      expect(brand.logoAlt).toBeTruthy()
    }
  })
})
