import type {
  AuthMfaChallengeMethod,
  IAuthModuleService,
} from "@medusajs/framework/types"
import { Modules, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { getMfaStepUpTtlSeconds } from "../../utils/mfa-assurance"

type VerifyMfaStepUpInput = {
  actor_id: string
  auth_identity_id: string
  challenge_id: string
  method: AuthMfaChallengeMethod
  code: string
  credential_hash: string
}

const verifyMfaStepUpStep = createStep(
  "verify-mfa-step-up",
  async (input: VerifyMfaStepUpInput, { container }) => {
    const authService = container.resolve<IAuthModuleService>(Modules.AUTH)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const challenge = await authService.verifyAuthMfaChallenge({
      id: input.challenge_id,
      method: input.method,
      code: input.code,
    })

    if (challenge.auth_identity_id !== input.auth_identity_id) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "MFA_CHALLENGE_IDENTITY_MISMATCH"
      )
    }

    const verifiedAt = new Date()
    const expiresAt = new Date(
      verifiedAt.getTime() + getMfaStepUpTtlSeconds() * 1000
    )
    const existing = await securityService.listMfaAssurances({
      auth_identity_id: input.auth_identity_id,
      credential_hash: input.credential_hash,
    })
    const activeIds = existing
      .filter((assurance) => !assurance.revoked_at)
      .map((assurance) => assurance.id)

    if (activeIds.length) {
      await securityService.updateMfaAssurances(
        activeIds.map((id) => ({ id, revoked_at: verifiedAt }))
      )
    }

    const assurance = await securityService.createMfaAssurances({
      auth_identity_id: input.auth_identity_id,
      actor_id: input.actor_id,
      credential_hash: input.credential_hash,
      verification_method: input.method,
      verified_at: verifiedAt,
      expires_at: expiresAt,
      revoked_at: null,
    })

    return new StepResponse({
      id: assurance.id,
      verified_at: assurance.verified_at,
      expires_at: assurance.expires_at,
    })
  }
)

export const verifyMfaStepUpWorkflow = createWorkflow(
  "verify-mfa-step-up",
  (input: VerifyMfaStepUpInput) => {
    const assurance = verifyMfaStepUpStep(input)

    return new WorkflowResponse(assurance)
  }
)
