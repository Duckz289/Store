import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { AddRepairPartUsageSchema } from "../../../../repair-validators"
import { addRepairPartUsageWorkflow } from "../../../../../workflows/repair/manage-repair-operations"

type AddRepairPartUsageBody = z.infer<typeof AddRepairPartUsageSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<AddRepairPartUsageBody>,
  res: MedusaResponse
) => {
  const { result } = await addRepairPartUsageWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      ...req.validatedBody,
      actor_id: req.auth_context.actor_id,
    },
  })

  return res.status(result.replayed ? 200 : 201).json(result)
}
