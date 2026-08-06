import { model } from "@medusajs/framework/utils"

import RepairCase from "./repair-case"

const RepairDeviceSnapshot = model
  .define("repair_device_snapshot", {
    id: model.id({ prefix: "repdev" }).primaryKey(),
    device_type: model.text(),
    brand: model.text().nullable(),
    model: model.text(),
    color: model.text().nullable(),
    serial_number: model.text().nullable(),
    imei: model.text().nullable(),
    condition_summary: model.text(),
    accessories: model.json().nullable(),
    product_title: model.text().nullable(),
    variant_title: model.text().nullable(),
    sku: model.text().nullable(),
    order_display_id: model.text().nullable(),
    purchased_at: model.dateTime().nullable(),
    warranty_context: model.text().nullable(),
    anonymized_at: model.dateTime().nullable(),
    case: model.belongsTo(() => RepairCase, { mappedBy: "device" }),
  })
  .indexes([{ on: ["case_id"], unique: true, where: "deleted_at IS NULL" }])

export default RepairDeviceSnapshot
