import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"

const RepairContactSnapshot = model
  .define("repair_contact_snapshot", {
    id: model.id({ prefix: "repcon" }).primaryKey(),
    full_name: model.text(),
    phone_normalized: model.text(),
    phone_lookup_hash: model.text(),
    email: model.text().nullable(),
    consented_at: model.dateTime(),
    anonymized_at: model.dateTime().nullable(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "contact" }),
  })
  .indexes([
    { on: ["case_id"], unique: true, where: "deleted_at IS NULL" },
    { on: ["phone_lookup_hash"], where: "deleted_at IS NULL" },
  ])

export default RepairContactSnapshot
