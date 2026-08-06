import { defineLink } from "@medusajs/framework/utils"
import UserModule from "@medusajs/medusa/user"

import RepairModule from "../modules/repair"

export default defineLink(
  { linkable: RepairModule.linkable.repairTechnicianAssignment, isList: true },
  UserModule.linkable.user
)
