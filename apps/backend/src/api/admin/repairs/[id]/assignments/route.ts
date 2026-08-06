import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { AssignRepairTechnicianSchema } from "../../../../repair-validators"
import { assignRepairTechnicianWorkflow } from "../../../../../workflows/repair/manage-repair-operations"

type AssignRepairTechnicianBody = z.infer<
  typeof AssignRepairTechnicianSchema
>

export const POST = async (
  req: AuthenticatedMedusaRequest<AssignRepairTechnicianBody>,
  res: MedusaResponse
) => {
  const { result } = await assignRepairTechnicianWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      ...req.validatedBody,
      actor_id: req.auth_context.actor_id,
    },
  })

  return res.status(result.replayed ? 200 : 201).json(result)
}
