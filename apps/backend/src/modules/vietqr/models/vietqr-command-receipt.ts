import { model } from "@medusajs/framework/utils"

const VietQrCommandReceipt = model
  .define("vietqr_command_receipt", {
    id: model.id({ prefix: "vqrcmd" }).primaryKey(),
    operation: model.enum(["confirm", "cancel", "refund", "reconcile"]),
    idempotency_key: model.text(),
    request_hash: model.text(),
    result_type: model.text(),
    result_id: model.text(),
    actor_id: model.text().nullable(),
    completed_at: model.dateTime(),
  })
  .indexes([
    {
      on: ["operation", "idempotency_key"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default VietQrCommandReceipt
