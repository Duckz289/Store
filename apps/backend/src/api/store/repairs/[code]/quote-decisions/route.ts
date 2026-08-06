import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { decideRepairQuoteWorkflow } from "../../../../../workflows/repair/manage-repair-quote"
import { DecideRepairQuoteSchema } from "../../../../repair-validators"

type DecideRepairQuoteBody = z.infer<typeof DecideRepairQuoteSchema>

export const POST = async (
  req: MedusaRequest<DecideRepairQuoteBody>,
  res: MedusaResponse
) => {
  const { result } = await decideRepairQuoteWorkflow(req.scope).run({
    input: {
      repair_code: req.params.code.toUpperCase(),
      ...req.validatedBody,
    },
  })

  return res.status(200).json(result)
}
