import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { presentRepairCase } from "../../../utils/repair-presentation"
import { createRepairCaseWorkflow } from "../../../workflows/repair/create-repair-case"
import { CreateStoreRepairSchema } from "../../repair-validators"

type CreateStoreRepairBody = z.infer<typeof CreateStoreRepairSchema>

export const POST = async (
  req: MedusaRequest<CreateStoreRepairBody>,
  res: MedusaResponse
) => {
  const { result } = await createRepairCaseWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      actor_type: "customer",
      intake_source: "store",
    },
  })

  return res.status(result.replayed ? 200 : 201).json({
    repair_case: presentRepairCase(result.repair_case),
    replayed: result.replayed,
  })
}
