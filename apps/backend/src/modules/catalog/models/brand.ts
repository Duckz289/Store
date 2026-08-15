import { model } from "@medusajs/framework/utils"

import ProductCatalogProfile from "./product-catalog-profile"

// "manufacturer" is a real hardware maker (Samsung, Panasonic).
// "store_label" is merchandise the shop sells under its own name.
// "unspecified" is stock whose maker is genuinely unknown; it is never guessed.
export const BRAND_KINDS = ["manufacturer", "store_label", "unspecified"] as const

const Brand = model
  .define("catalog_brand", {
    id: model.id({ prefix: "brand" }).primaryKey(),
    name: model.text(),
    handle: model.text(),
    kind: model.enum([...BRAND_KINDS]).default("manufacturer"),
    logo_url: model.text().nullable(),
    logo_alt: model.text().nullable(),
    products: model.hasMany(() => ProductCatalogProfile, {
      mappedBy: "brand",
    }),
  })
  .indexes([
    { on: ["handle"], unique: true, where: "deleted_at IS NULL" },
    { on: ["name"], where: "deleted_at IS NULL" },
    { on: ["kind"], where: "deleted_at IS NULL" },
  ])

export default Brand
