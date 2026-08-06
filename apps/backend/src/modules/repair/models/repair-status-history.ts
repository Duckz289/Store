import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"

const statuses = [
  "intake",
  "diagnosis",
  "quote",
  "awaiting_customer_decision",
  "repair",
  "quality_assurance",
  "return_ready",
  "returned",
  "closed",
  "canceled",
]

const RepairStatusHistory = model
  .define("repair_status_history", {
    id: model.id({ prefix: "rephist" }).primaryKey(),
    from_status: model.enum(statuses).nullable(),
    to_status: model.enum(statuses),
    actor_type: model.enum(["customer", "user", "system"]),
    actor_id: model.text().nullable(),
    reason_code: model.text().nullable(),
    public_note: model.text().nullable(),
    metadata: model.json().nullable(),
    idempotency_key: model.text(),
    sequence: model.number(),
    occurred_at: model.dateTime(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "status_history" }),
  })
  .indexes([
    { on: ["idempotency_key"], unique: true, where: "deleted_at IS NULL" },
    {
      on: ["case_id", "sequence"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default RepairStatusHistory
