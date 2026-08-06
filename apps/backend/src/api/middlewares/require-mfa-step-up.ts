import type { IAuthModuleService } from "@medusajs/framework/types"
import type {
  AuthContext,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import {
  getCredentialFingerprint,
  hasValidMfaAssurance,
} from "../../utils/mfa-assurance"

const STEP_UP_ROUTE_PREFIX = "/admin/security/mfa/"

export async function requireMfaStepUp(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.originalUrl.split("?", 1)[0].startsWith(STEP_UP_ROUTE_PREFIX)) {
    return next()
  }

  const authContext = (req as MedusaRequest & { auth_context?: AuthContext })
    .auth_context
  if (!authContext?.auth_identity_id || authContext.actor_type !== "user") {
    return next(
      new MedusaError(MedusaError.Types.UNAUTHORIZED, "UNAUTHORIZED")
    )
  }

  const credential = getCredentialFingerprint(req)
  if (!credential) {
    return next(
      new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "MFA_STEP_UP_REQUIRES_SESSION_OR_BEARER"
      )
    )
  }

  const authService = req.scope.resolve<IAuthModuleService>(Modules.AUTH)
  const enabledFactors = await authService.listAuthMfa({
    auth_identity_id: authContext.auth_identity_id,
    status: "enabled",
  })

  if (!enabledFactors.length) {
    return next(
      new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "MFA_ENROLLMENT_REQUIRED"
      )
    )
  }

  const securityService = req.scope.resolve<SecurityModuleService>(
    SECURITY_MODULE
  )
  const assurances = await securityService.listMfaAssurances(
    {
      auth_identity_id: authContext.auth_identity_id,
      credential_hash: credential.hash,
    },
    {
      order: { verified_at: "DESC" },
      take: 10,
    }
  )
  const hasValidAssurance = hasValidMfaAssurance(assurances)

  if (!hasValidAssurance) {
    return next(
      new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "MFA_STEP_UP_REQUIRED"
      )
    )
  }

  return next()
}
