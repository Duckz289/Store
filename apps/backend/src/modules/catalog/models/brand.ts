import { model } from "@medusajs/framework/utils"

import ProductCatalogProfile from "./product-catalog-profile"

const Brand = model
  .define("catalog_brand", {
    id: model.id({ prefix: "brand" }).primaryKey(),
    name: model.text(),
    handle: model.text(),
    products: model.hasMany(() => ProductCatalogProfile, {
      mappedBy: "brand",
    }),
  })
  .indexes([
    { on: ["handle"], unique: true, where: "deleted_at IS NULL" },
    { on: ["name"], where: "deleted_at IS NULL" },
  ])

export default Brand
