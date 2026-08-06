import type { IAuthModuleService } from "@medusajs/framework/types"
import { Modules, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

type StartMfaStepUpInput = {
  actor_id: string
  auth_identity_id: string
  auth_provider?: string | null
}

const startMfaStepUpStep = createStep(
  "start-mfa-step-up",
  async (input: StartMfaStepUpInput, { container }) => {
    const authService = container.resolve<IAuthModuleService>(Modules.AUTH)
    const enabledFactors = await authService.listAuthMfa({
      auth_identity_id: input.auth_identity_id,
      status: "enabled",
    })

    if (!enabledFactors.length) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "MFA_ENROLLMENT_REQUIRED"
      )
    }

    const challenge = await authService.createAuthMfaChallenge({
      auth_identity_id: input.auth_identity_id,
      auth_provider: input.auth_provider,
      metadata: {
        actor_id: input.actor_id,
        purpose: "admin_step_up",
      },
    })

    return new StepResponse({
      id: challenge.id,
      methods: challenge.methods,
      expires_at: challenge.expires_at,
    })
  }
)

export const startMfaStepUpWorkflow = createWorkflow(
  "start-mfa-step-up",
  (input: StartMfaStepUpInput) => {
    const challenge = startMfaStepUpStep(input)

    return new WorkflowResponse(challenge)
  }
)
