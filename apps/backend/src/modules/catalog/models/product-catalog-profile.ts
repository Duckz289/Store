import { model } from "@medusajs/framework/utils"

import Brand from "./brand"

const ProductCatalogProfile = model.define("catalog_product_profile", {
  id: model.id({ prefix: "catprof" }).primaryKey(),
  model: model.text().nullable(),
  specifications: model.json().nullable(),
  media_alt_text: model.json().nullable(),
  merchandising: model.json().nullable(),
  brand: model
    .belongsTo(() => Brand, { mappedBy: "products" })
    .nullable(),
})

export default ProductCatalogProfile
