import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"

import RepairModule from "../modules/repair"

export default defineLink(
  { linkable: RepairModule.linkable.repairCase, isList: true },
  CustomerModule.linkable.customer
)
