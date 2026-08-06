import { model } from "@medusajs/framework/utils"

const VietQrReconciliationIssue = model
  .define("vietqr_reconciliation_issue", {
    id: model.id({ prefix: "vqrissue" }).primaryKey(),
    payment_session_id: model.text(),
    order_id: model.text().nullable(),
    fingerprint: model.text(),
    issue_type: model.enum([
      "expired_pending",
      "exact_without_capture",
      "amount_currency_mismatch",
      "duplicate_bank_transaction",
      "capture_without_observation",
      "refund_without_receipt",
      "intent_integrity",
    ]),
    status: model.enum(["open", "resolved"]),
    details: model.json().nullable(),
    detected_at: model.dateTime(),
    resolved_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["fingerprint"], unique: true, where: "deleted_at IS NULL" },
    {
      on: ["payment_session_id", "status"],
      where: "deleted_at IS NULL",
    },
  ])

export default VietQrReconciliationIssue
