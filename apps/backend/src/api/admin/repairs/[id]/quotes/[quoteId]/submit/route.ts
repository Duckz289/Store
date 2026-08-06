import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { SubmitRepairQuoteSchema } from "../../../../../../repair-validators"
import { submitRepairQuoteWorkflow } from "../../../../../../../workflows/repair/manage-repair-quote"

type SubmitRepairQuoteBody = z.infer<typeof SubmitRepairQuoteSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<SubmitRepairQuoteBody>,
  res: MedusaResponse
) => {
  const { result } = await submitRepairQuoteWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      quote_id: req.params.quoteId,
      ...req.validatedBody,
      actor_id: req.auth_context.actor_id,
      actor_type: "user",
    },
  })

  return res.status(200).json(result)
}
