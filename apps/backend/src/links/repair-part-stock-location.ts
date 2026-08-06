import { defineLink } from "@medusajs/framework/utils"
import StockLocationModule from "@medusajs/medusa/stock-location"

import RepairModule from "../modules/repair"

export default defineLink(
  { linkable: RepairModule.linkable.repairPartUsage, isList: true },
  StockLocationModule.linkable.stockLocation
)
