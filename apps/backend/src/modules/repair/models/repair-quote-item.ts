import { model } from "@medusajs/framework/utils"

import RepairQuote from "./repair-quote"

const RepairQuoteItem = model
  .define("repair_quote_item", {
    id: model.id({ prefix: "repqitem" }).primaryKey(),
    kind: model.enum(["service", "part", "labor", "discount"]),
    title: model.text(),
    sku: model.text().nullable(),
    quantity: model.number(),
    unit_price: model.number(),
    line_total: model.number(),
    internal_cost: model.number().nullable(),
    position: model.number(),
    quote: model.belongsTo(() => RepairQuote, { mappedBy: "items" }),
  })
  .indexes([{ on: ["quote_id", "position"], where: "deleted_at IS NULL" }])

export default RepairQuoteItem
