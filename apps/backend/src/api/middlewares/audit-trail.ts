import type {
  AuthContext,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { appendAuditEventWorkflow } from "../../workflows/security/append-audit-event"
import {
  classifySecurityRequest,
  getCorrelationId,
} from "../../utils/security-request"

const pendingAuditWrites = new Set<Promise<unknown>>()

const redactAuditPayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload
  }

  const redacted = { ...(payload as Record<string, unknown>) }
  for (const key of [
    "code",
    "password",
    "secret",
    "token",
    "otpauth_url",
    "recovery_codes",
  ]) {
    if (key in redacted) {
      redacted[key] = "[REDACTED]"
    }
  }

  return redacted
}

export async function waitForPendingAuditWrites() {
  await Promise.allSettled([...pendingAuditWrites])
}

export function captureAuditTrail(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const securityRequest = req as MedusaRequest & {
    auth_context?: AuthContext
  }
  const correlationId = getCorrelationId(req)
  const target = classifySecurityRequest(req.method, req.originalUrl)
  const startedAt = Date.now()
  const logger = req.scope.resolve<Logger>(ContainerRegistrationKeys.LOGGER)

  res.setHeader("x-request-id", correlationId)
  res.once("finish", () => {
    const statusCode = res.statusCode
    const outcome =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "denied" : "success"

    const auditWrite = appendAuditEventWorkflow(req.scope)
      .run({
        input: {
          correlation_id: correlationId,
          actor_id: securityRequest.auth_context?.actor_id,
          actor_type: securityRequest.auth_context?.actor_type,
          auth_identity_id: securityRequest.auth_context?.auth_identity_id,
          ...target,
          request_method: req.method,
          request_path: req.path,
          outcome,
          status_code: statusCode,
          after: redactAuditPayload(req.validatedBody ?? req.body),
          metadata: {
            duration_ms: Date.now() - startedAt,
          },
        },
      })
      .catch((error: unknown) => {
        logger.error(
          `Failed to append security audit event for ${correlationId}: ${String(error)}`
        )
      })
      .finally(() => pendingAuditWrites.delete(auditWrite))

    pendingAuditWrites.add(auditWrite)
  })

  next()
}
