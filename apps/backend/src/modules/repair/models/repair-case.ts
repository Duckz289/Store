import { model } from "@medusajs/framework/utils"

import RepairAttachment from "./repair-attachment"
import RepairContactSnapshot from "./repair-contact-snapshot"
import RepairDeviceSnapshot from "./repair-device-snapshot"
import RepairDiagnosis from "./repair-diagnosis"
import RepairPartUsage from "./repair-part-usage"
import RepairQuote from "./repair-quote"
import RepairStatusHistory from "./repair-status-history"
import RepairTechnicianAssignment from "./repair-technician-assignment"

const RepairCase = model
  .define("repair_case", {
    id: model.id({ prefix: "repcase" }).primaryKey(),
    code: model.text(),
    status: model.enum([
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
    ]),
    revision: model.number().default(1),
    public_summary: model.text().nullable(),
    internal_note: model.text().nullable(),
    intake_source: model.enum(["store", "admin"]),
    sla_due_at: model.dateTime().nullable(),
    promised_due_at: model.dateTime().nullable(),
    received_at: model.dateTime().nullable(),
    repair_completed_at: model.dateTime().nullable(),
    ready_at: model.dateTime().nullable(),
    returned_at: model.dateTime().nullable(),
    closed_at: model.dateTime().nullable(),
    canceled_at: model.dateTime().nullable(),
    last_reconciled_at: model.dateTime().nullable(),
    contact: model.hasOne(() => RepairContactSnapshot, {
      mappedBy: "case",
    }),
    device: model.hasOne(() => RepairDeviceSnapshot, {
      mappedBy: "case",
    }),
    diagnoses: model.hasMany(() => RepairDiagnosis, { mappedBy: "case" }),
    quotes: model.hasMany(() => RepairQuote, { mappedBy: "case" }),
    parts: model.hasMany(() => RepairPartUsage, { mappedBy: "case" }),
    assignments: model.hasMany(() => RepairTechnicianAssignment, {
      mappedBy: "case",
    }),
    attachments: model.hasMany(() => RepairAttachment, {
      mappedBy: "case",
    }),
    status_history: model.hasMany(() => RepairStatusHistory, {
      mappedBy: "case",
    }),
  })
  .indexes([
    { on: ["code"], unique: true, where: "deleted_at IS NULL" },
    { on: ["status", "sla_due_at"], where: "deleted_at IS NULL" },
    { on: ["created_at"], where: "deleted_at IS NULL" },
  ])

export default RepairCase
