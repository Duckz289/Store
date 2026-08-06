import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"

import RepairModule from "../modules/repair"

export default defineLink(
  { linkable: RepairModule.linkable.repairCase, isList: true },
  OrderModule.linkable.order
)
