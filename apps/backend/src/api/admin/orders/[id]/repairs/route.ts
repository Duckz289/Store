import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import repairOrderLink from "../../../../../links/repair-order"
import { presentRepairCase } from "../../../../../utils/repair-presentation"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: repairOrderLink.entryPoint,
    fields: ["repair_case.*", "repair_case.device.*"],
    filters: { order_id: req.params.id },
  })
  const cases = data
    .map((entry) => (entry as { repair_case?: unknown }).repair_case)
    .filter(Boolean) as Parameters<typeof presentRepairCase>[0][]

  return res.status(200).json({
    repair_cases: cases.map(presentRepairCase),
  })
}
