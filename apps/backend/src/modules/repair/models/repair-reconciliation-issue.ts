import { model } from "@medusajs/framework/utils"

const RepairReconciliationIssue = model
  .define("repair_reconciliation_issue", {
    id: model.id({ prefix: "repissue" }).primaryKey(),
    repair_case_id: model.text(),
    fingerprint: model.text(),
    issue_type: model.enum([
      "status_history_mismatch",
      "quote_integrity",
      "pending_part_usage",
      "terminal_resource_active",
      "sla_overdue",
      "retention_due",
    ]),
    status: model.enum(["open", "resolved"]),
    details: model.json().nullable(),
    detected_at: model.dateTime(),
    resolved_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["fingerprint"], unique: true, where: "deleted_at IS NULL" },
    { on: ["repair_case_id", "status"], where: "deleted_at IS NULL" },
  ])

export default RepairReconciliationIssue
