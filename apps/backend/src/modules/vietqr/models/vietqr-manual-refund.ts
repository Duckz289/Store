import { model } from "@medusajs/framework/utils"

const VietQrManualRefund = model
  .define("vietqr_manual_refund", {
    id: model.id({ prefix: "vqrrefund" }).primaryKey(),
    payment_id: model.text(),
    order_id: model.text().nullable(),
    amount: model.bigNumber(),
    currency_code: model.text(),
    bank_transaction_reference: model.text(),
    bank_transaction_hash: model.text(),
    note: model.text().nullable(),
    actor_id: model.text(),
    medusa_refund_id: model.text().nullable(),
    refunded_at: model.dateTime(),
  })
  .indexes([
    {
      on: ["bank_transaction_hash"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    { on: ["payment_id", "refunded_at"], where: "deleted_at IS NULL" },
  ])

export default VietQrManualRefund
