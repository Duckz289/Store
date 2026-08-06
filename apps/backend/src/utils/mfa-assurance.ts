import type {
  AuthContext,
  MedusaRequest,
  SecretKeyContext,
} from "@medusajs/framework/http"

import { hashCredential } from "./security-audit"

const DEFAULT_TTL_SECONDS = 600
const MIN_TTL_SECONDS = 60
const MAX_TTL_SECONDS = 3600

export type CredentialFingerprint = {
  hash: string
  kind: "bearer" | "session"
}

export type MfaAssuranceRecord = {
  expires_at: Date | string
  revoked_at?: Date | string | null
}

type SecurityRequest = MedusaRequest & {
  auth_context?: AuthContext
  secret_key_context?: SecretKeyContext
  sessionID?: string
}

export function getMfaStepUpTtlSeconds(): number {
  const configured = Number(process.env.MFA_STEP_UP_TTL_SECONDS)

  if (!Number.isInteger(configured)) {
    return DEFAULT_TTL_SECONDS
  }

  return Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, configured))
}

export function getCredentialFingerprint(
  req: MedusaRequest
): CredentialFingerprint | null {
  const securityRequest = req as SecurityRequest

  if (securityRequest.secret_key_context) {
    return null
  }

  const authorization = req.headers.authorization
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return {
      hash: hashCredential(`bearer:${authorization.slice(7)}`),
      kind: "bearer",
    }
  }

  if (securityRequest.sessionID) {
    return {
      hash: hashCredential(`session:${securityRequest.sessionID}`),
      kind: "session",
    }
  }

  return null
}

export function hasValidMfaAssurance(
  assurances: MfaAssuranceRecord[],
  now = new Date()
): boolean {
  return assurances.some(
    (assurance) =>
      !assurance.revoked_at &&
      new Date(assurance.expires_at).getTime() > now.getTime()
  )
}
