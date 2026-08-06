import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { TransitionRepairSchema } from "../../../../repair-validators"
import { transitionRepairCaseWorkflow } from "../../../../../workflows/repair/transition-repair-case"

type TransitionRepairBody = z.infer<typeof TransitionRepairSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<TransitionRepairBody>,
  res: MedusaResponse
) => {
  const { result } = await transitionRepairCaseWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      ...req.validatedBody,
      actor_type: "user",
      actor_id: req.auth_context.actor_id,
    },
  })

  return res.status(200).json(result)
}
