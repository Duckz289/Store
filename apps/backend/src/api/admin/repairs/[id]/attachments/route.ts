import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { AddRepairAttachmentSchema } from "../../../../repair-validators"
import { addRepairAttachmentWorkflow } from "../../../../../workflows/repair/manage-repair-operations"

type AddRepairAttachmentBody = z.infer<typeof AddRepairAttachmentSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<AddRepairAttachmentBody>,
  res: MedusaResponse
) => {
  const { result } = await addRepairAttachmentWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      ...req.validatedBody,
      actor_id: req.auth_context.actor_id,
    },
  })

  return res.status(result.replayed ? 200 : 201).json(result)
}
