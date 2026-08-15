import type {
  AuthContext,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { appendRequestTrace } from "../../utils/request-trace"
import { getCorrelationId } from "../../utils/security-request"

export function traceRequest(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const correlationId = getCorrelationId(req)
  const startedAt = Date.now()
  const logger = req.scope.resolve<Logger>(ContainerRegistrationKeys.LOGGER)

  req.headers["x-request-id"] = correlationId
  res.setHeader("x-request-id", correlationId)
  res.once("finish", () => {
    const authContext = (
      req as MedusaRequest & { auth_context?: AuthContext }
    ).auth_context
    appendRequestTrace(
      {
        correlation_id: correlationId,
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        duration_ms: Date.now() - startedAt,
        actor_id: authContext?.actor_id ?? null,
        occurred_at: new Date().toISOString(),
      },
      logger
    )
  })

  next()
}
