import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { SaveRepairQuoteSchema } from "../../../../repair-validators"
import { saveRepairQuoteWorkflow } from "../../../../../workflows/repair/manage-repair-quote"

type SaveRepairQuoteBody = z.infer<typeof SaveRepairQuoteSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<SaveRepairQuoteBody>,
  res: MedusaResponse
) => {
  const { result } = await saveRepairQuoteWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      ...req.validatedBody,
      actor_id: req.auth_context.actor_id,
      actor_type: "user",
    },
  })

  return res.status(result.replayed ? 200 : 201).json(result)
}
