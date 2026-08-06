import { model } from "@medusajs/framework/utils"

const AuditEvent = model
  .define("security_audit_event", {
    id: model.id({ prefix: "aevt" }).primaryKey(),
    correlation_id: model.text(),
    actor_id: model.text().nullable(),
    actor_type: model.text().nullable(),
    auth_identity_id: model.text().nullable(),
    action: model.text(),
    resource_type: model.text(),
    resource_id: model.text().nullable(),
    request_method: model.text().nullable(),
    request_path: model.text().nullable(),
    outcome: model.enum(["success", "denied", "error"]),
    status_code: model.number().nullable(),
    before: model.json().nullable(),
    after: model.json().nullable(),
    metadata: model.json().nullable(),
    integrity_nonce: model.text(),
    event_hash: model.text(),
    occurred_at: model.dateTime(),
  })
  .indexes([
    {
      on: ["event_hash"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["correlation_id"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["actor_id"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["resource_type", "resource_id"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["occurred_at"],
      where: "deleted_at IS NULL",
    },
  ])

export default AuditEvent
