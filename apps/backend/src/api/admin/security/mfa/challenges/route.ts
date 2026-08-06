import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { startMfaStepUpWorkflow } from "../../../../../workflows/security/start-mfa-step-up"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await startMfaStepUpWorkflow(req.scope).run({
    input: {
      actor_id: req.auth_context.actor_id,
      auth_identity_id: req.auth_context.auth_identity_id,
      auth_provider: req.auth_context.auth_provider,
    },
  })

  return res.status(201).json({ challenge: result })
}
