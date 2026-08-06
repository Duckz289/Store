import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { getCredentialFingerprint } from "../../../../../../../utils/mfa-assurance"
import { verifyMfaStepUpWorkflow } from "../../../../../../../workflows/security/verify-mfa-step-up"

export const VerifyMfaStepUpSchema = z.object({
  method: z.union([z.literal("totp"), z.literal("recovery_code")]),
  code: z.string().min(1).max(128),
})

type VerifyMfaStepUpBody = z.infer<typeof VerifyMfaStepUpSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<VerifyMfaStepUpBody>,
  res: MedusaResponse
) => {
  const credential = getCredentialFingerprint(req)

  if (!credential) {
    throw new MedusaError(
      MedusaError.Types.FORBIDDEN,
      "MFA_STEP_UP_REQUIRES_SESSION_OR_BEARER"
    )
  }

  const { result } = await verifyMfaStepUpWorkflow(req.scope).run({
    input: {
      actor_id: req.auth_context.actor_id,
      auth_identity_id: req.auth_context.auth_identity_id,
      challenge_id: req.params.id,
      method: req.validatedBody.method,
      code: req.validatedBody.code,
      credential_hash: credential.hash,
    },
  })

  return res.status(200).json({ assurance: result })
}
