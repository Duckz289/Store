import { model } from "@medusajs/framework/utils"

import Brand from "./brand"

// Seeded sample rows are marked so staff can tell placeholder pricing and stock
// apart from stock the shop has actually counted. Never exposed to the storefront.
export const CATALOG_DATA_SOURCES = ["real", "demo_fixture"] as const

const ProductCatalogProfile = model.define("catalog_product_profile", {
  id: model.id({ prefix: "catprof" }).primaryKey(),
  model: model.text().nullable(),
  specifications: model.json().nullable(),
  media_alt_text: model.json().nullable(),
  merchandising: model.json().nullable(),
  data_source: model.enum([...CATALOG_DATA_SOURCES]).default("real"),
  internal_note: model.text().nullable(),
  brand: model
    .belongsTo(() => Brand, { mappedBy: "products" })
    .nullable(),
})

export default ProductCatalogProfile
