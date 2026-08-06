import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { getCredentialFingerprint } from "../../utils/mfa-assurance"

export async function revokeMfaAssurance(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const credential = getCredentialFingerprint(req)
  if (!credential) {
    return next()
  }

  try {
    const securityService = req.scope.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const assurances = await securityService.listMfaAssurances({
      credential_hash: credential.hash,
      revoked_at: null,
    })

    if (assurances.length) {
      const revokedAt = new Date()
      await securityService.updateMfaAssurances(
        assurances.map((assurance) => ({
          id: assurance.id,
          revoked_at: revokedAt,
        }))
      )
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
