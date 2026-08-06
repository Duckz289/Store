import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"
import RepairQuote from "./repair-quote"

const RepairAccessToken = model
  .define("repair_access_token", {
    id: model.id({ prefix: "reptok" }).primaryKey(),
    token_hash: model.text(),
    purpose: model.enum(["quote_decision"]),
    expires_at: model.dateTime(),
    consumed_at: model.dateTime().nullable(),
    revoked_at: model.dateTime().nullable(),
    case: model.belongsTo(() => RepairCase),
    quote: model.belongsTo(() => RepairQuote),
  })
  .indexes([
    { on: ["token_hash"], unique: true, where: "deleted_at IS NULL" },
    { on: ["case_id", "purpose"], where: "deleted_at IS NULL" },
  ])

export default RepairAccessToken
