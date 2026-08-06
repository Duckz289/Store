import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"

const RepairAttachment = model
  .define("repair_attachment", {
    id: model.id({ prefix: "repatt" }).primaryKey(),
    file_reference: model.text(),
    storage_provider: model.text(),
    classification: model.enum([
      "intake_photo",
      "diagnosis_photo",
      "qa_photo",
      "handover_document",
    ]),
    mime_type: model.text(),
    size_bytes: model.number(),
    checksum: model.text(),
    uploaded_by: model.text().nullable(),
    anonymized_at: model.dateTime().nullable(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "attachments" }),
  })
  .indexes([
    { on: ["file_reference"], unique: true, where: "deleted_at IS NULL" },
    { on: ["case_id", "classification"], where: "deleted_at IS NULL" },
  ])

export default RepairAttachment
