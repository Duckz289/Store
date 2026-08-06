import { model } from "@medusajs/framework/utils"

const VietQrTransferObservation = model
  .define("vietqr_transfer_observation", {
    id: model.id({ prefix: "vqrobs" }).primaryKey(),
    payment_session_id: model.text(),
    order_id: model.text(),
    provider_reference: model.text(),
    expected_amount: model.bigNumber(),
    observed_amount: model.bigNumber(),
    currency_code: model.text(),
    observed_reference: model.text(),
    outcome: model.enum([
      "exact",
      "underpaid",
      "overpaid",
      "wrong_reference",
      "expired",
    ]),
    bank_transaction_reference: model.text(),
    bank_transaction_hash: model.text(),
    note: model.text().nullable(),
    actor_id: model.text(),
    observed_at: model.dateTime(),
  })
  .indexes([
    {
      on: ["bank_transaction_hash"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["payment_session_id", "observed_at"],
      where: "deleted_at IS NULL",
    },
  ])

export default VietQrTransferObservation
