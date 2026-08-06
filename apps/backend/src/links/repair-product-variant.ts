import { defineLink } from "@medusajs/framework/utils"
import ProductModule from "@medusajs/medusa/product"

import RepairModule from "../modules/repair"

export default defineLink(
  { linkable: RepairModule.linkable.repairCase, isList: true },
  ProductModule.linkable.productVariant
)
