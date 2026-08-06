import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"

const RepairDiagnosis = model
  .define("repair_diagnosis", {
    id: model.id({ prefix: "repdiag" }).primaryKey(),
    version: model.number(),
    severity: model.enum(["low", "medium", "high", "critical"]),
    findings: model.text(),
    recommended_action: model.text(),
    internal_note: model.text().nullable(),
    diagnosed_by: model.text(),
    diagnosed_by_name: model.text().nullable(),
    completed_at: model.dateTime(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "diagnoses" }),
  })
  .indexes([
    {
      on: ["case_id", "version"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default RepairDiagnosis
