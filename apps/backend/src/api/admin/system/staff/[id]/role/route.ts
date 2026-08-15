import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { getCorrelationId } from "../../../../../../utils/security-request"
import { assignStaffRoleWorkflow } from "../../../../../../workflows/system/assign-staff-role"

export const AssignStaffRoleSchema = z.object({
  role_id: z.string().min(1).nullable(),
})

type AssignStaffRoleBody = z.infer<typeof AssignStaffRoleSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<AssignStaffRoleBody>,
  res: MedusaResponse
) => {
  const actorId = req.auth_context.actor_id
  if (!actorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "UNAUTHORIZED")
  }
  const { result } = await assignStaffRoleWorkflow(req.scope).run({
    input: {
      actor_id: actorId,
      user_id: req.params.id,
      role_id: req.validatedBody.role_id,
      correlation_id: getCorrelationId(req),
    },
  })

  return res.status(200).json(result)
}
