import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"

const RepairPartUsage = model
  .define("repair_part_usage", {
    id: model.id({ prefix: "reppart" }).primaryKey(),
    status: model.enum(["pending", "applied", "reversed"]),
    inventory_item_id: model.text(),
    location_id: model.text(),
    sku: model.text().nullable(),
    title: model.text(),
    quantity: model.number(),
    applied_at: model.dateTime().nullable(),
    reversed_at: model.dateTime().nullable(),
    idempotency_key: model.text(),
    reversal_key: model.text().nullable(),
    actor_id: model.text(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "parts" }),
  })
  .indexes([
    { on: ["idempotency_key"], unique: true, where: "deleted_at IS NULL" },
    { on: ["reversal_key"], unique: true, where: "reversal_key IS NOT NULL AND deleted_at IS NULL" },
    { on: ["case_id", "status"], where: "deleted_at IS NULL" },
  ])

export default RepairPartUsage
