import { model } from "@medusajs/framework/utils"

const RepairCommandReceipt = model
  .define("repair_command_receipt", {
    id: model.id({ prefix: "repcmd" }).primaryKey(),
    command_key: model.text(),
    command_type: model.text(),
    request_hash: model.text(),
    result_type: model.text(),
    result_id: model.text(),
    actor_id: model.text().nullable(),
    completed_at: model.dateTime(),
  })
  .indexes([
    { on: ["command_key"], unique: true, where: "deleted_at IS NULL" },
  ])

export default RepairCommandReceipt
