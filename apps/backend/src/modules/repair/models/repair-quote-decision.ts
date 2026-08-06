import { model } from "@medusajs/framework/utils"

import RepairQuote from "./repair-quote"

const RepairQuoteDecision = model
  .define("repair_quote_decision", {
    id: model.id({ prefix: "repqdec" }).primaryKey(),
    decision: model.enum(["approved", "rejected"]),
    actor_type: model.enum(["customer", "user"]),
    actor_id: model.text().nullable(),
    evidence: model.text().nullable(),
    decided_at: model.dateTime(),
    idempotency_key: model.text(),
    quote: model.belongsTo(() => RepairQuote, { mappedBy: "decisions" }),
  })
  .indexes([
    { on: ["quote_id"], unique: true, where: "deleted_at IS NULL" },
    { on: ["idempotency_key"], unique: true, where: "deleted_at IS NULL" },
  ])

export default RepairQuoteDecision
