import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"
import RepairQuoteDecision from "./repair-quote-decision"
import RepairQuoteItem from "./repair-quote-item"

const RepairQuote = model
  .define("repair_quote", {
    id: model.id({ prefix: "repquote" }).primaryKey(),
    version: model.number(),
    status: model.enum([
      "draft",
      "submitted",
      "approved",
      "rejected",
      "superseded",
      "expired",
    ]),
    currency_code: model.text(),
    subtotal: model.number().default(0),
    total: model.number().default(0),
    content_hash: model.text().nullable(),
    diagnosis_version: model.number(),
    valid_until: model.dateTime().nullable(),
    submitted_at: model.dateTime().nullable(),
    decided_at: model.dateTime().nullable(),
    created_by: model.text(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "quotes" }),
    items: model.hasMany(() => RepairQuoteItem, { mappedBy: "quote" }),
    decisions: model.hasMany(() => RepairQuoteDecision, {
      mappedBy: "quote",
    }),
  })
  .indexes([
    {
      on: ["case_id", "version"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    { on: ["status", "valid_until"], where: "deleted_at IS NULL" },
  ])

export default RepairQuote
