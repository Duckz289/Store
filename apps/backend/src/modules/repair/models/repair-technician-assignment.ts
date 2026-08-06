import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"

const RepairTechnicianAssignment = model
  .define("repair_technician_assignment", {
    id: model.id({ prefix: "repassign" }).primaryKey(),
    technician_user_id: model.text(),
    technician_name: model.text(),
    assigned_by: model.text(),
    assigned_at: model.dateTime(),
    ended_at: model.dateTime().nullable(),
    idempotency_key: model.text(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "assignments" }),
  })
  .indexes([
    { on: ["idempotency_key"], unique: true, where: "deleted_at IS NULL" },
    { on: ["case_id", "ended_at"], where: "deleted_at IS NULL" },
  ])

export default RepairTechnicianAssignment
