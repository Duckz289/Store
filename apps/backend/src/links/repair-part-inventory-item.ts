import { defineLink } from "@medusajs/framework/utils"
import InventoryModule from "@medusajs/medusa/inventory"

import RepairModule from "../modules/repair"

export default defineLink(
  { linkable: RepairModule.linkable.repairPartUsage, isList: true },
  InventoryModule.linkable.inventoryItem
)
