import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { ReverseRepairPartUsageSchema } from "../../../../../../repair-validators"
import { reverseRepairPartUsageWorkflow } from "../../../../../../../workflows/repair/manage-repair-operations"

type ReverseRepairPartUsageBody = z.infer<
  typeof ReverseRepairPartUsageSchema
>

export const POST = async (
  req: AuthenticatedMedusaRequest<ReverseRepairPartUsageBody>,
  res: MedusaResponse
) => {
  const { result } = await reverseRepairPartUsageWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      part_usage_id: req.params.partId,
      ...req.validatedBody,
      actor_id: req.auth_context.actor_id,
    },
  })

  return res.status(200).json(result)
}
