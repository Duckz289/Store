import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { REPAIR_MODULE } from "../../../../../modules/repair"
import RepairModuleService from "../../../../../modules/repair/service"
import { presentRepairContact } from "../../../../../utils/repair-presentation"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const repairService = req.scope.resolve<RepairModuleService>(REPAIR_MODULE)
  const contacts = await repairService.listRepairContactSnapshots({
    case_id: req.params.id,
  })

  return res.status(200).json({
    contact: contacts[0] ? presentRepairContact(contacts[0]) : null,
  })
}
