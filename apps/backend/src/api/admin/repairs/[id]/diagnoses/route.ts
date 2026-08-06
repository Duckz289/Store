import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { RecordRepairDiagnosisSchema } from "../../../../repair-validators"
import { recordRepairDiagnosisWorkflow } from "../../../../../workflows/repair/manage-repair-operations"

type RecordRepairDiagnosisBody = z.infer<typeof RecordRepairDiagnosisSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<RecordRepairDiagnosisBody>,
  res: MedusaResponse
) => {
  const { result } = await recordRepairDiagnosisWorkflow(req.scope).run({
    input: {
      repair_case_id: req.params.id,
      ...req.validatedBody,
      actor_id: req.auth_context.actor_id,
    },
  })

  return res.status(result.replayed ? 200 : 201).json(result)
}
