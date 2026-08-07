import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { appendAuditEventWorkflow } from "../../workflows/security/append-audit-event"
import { hashRecoveryIdentifier } from "../../utils/account-recovery"
import { getCorrelationId } from "../../utils/security-request"

function recoveryAction(path: string) {
  return path.endsWith("/reset-password")
    ? "auth.customer.password_reset.request"
    : "auth.customer.password_reset.update"
}

export function auditPasswordRecovery(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const identifier =
    typeof body.identifier === "string"
      ? body.identifier
      : typeof body.email === "string"
        ? body.email
        : ""
  const correlationId = getCorrelationId(req)
  const action = recoveryAction(req.path)
  const logger = req.scope.resolve<Logger>(ContainerRegistrationKeys.LOGGER)

  res.once("finish", () => {
    const statusCode = res.statusCode
    const outcome =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "denied" : "success"

    void appendAuditEventWorkflow(req.scope)
      .run({
        input: {
          correlation_id: correlationId,
          actor_id: null,
          actor_type: "customer",
          auth_identity_id: null,
          action,
          resource_type: "auth_identity",
          resource_id: null,
          request_method: req.method,
          request_path: req.path,
          outcome,
          status_code: statusCode,
          after: {
            identifier_hash: identifier
              ? hashRecoveryIdentifier(identifier)
              : null,
            provider: req.params.auth_provider,
          },
          metadata: {
            recovery_flow: action.endsWith("request") ? "request" : "update",
          },
        },
      })
      .catch(() => {
        logger.error(
          `Failed to append password recovery audit event for ${correlationId}`
        )
      })
  })

  next()
}
