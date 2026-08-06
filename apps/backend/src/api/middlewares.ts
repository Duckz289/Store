import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"

import "../policies/security"
import { ListAuditEventsSchema } from "./admin/security/audit-events/route"
import { VerifyMfaStepUpSchema } from "./admin/security/mfa/challenges/[id]/verify/route"
import { captureAuditTrail } from "./middlewares/audit-trail"
import { requireMfaStepUp } from "./middlewares/require-mfa-step-up"
import { revokeMfaAssurance } from "./middlewares/revoke-mfa-assurance"

const adminAuthentication = authenticate("user", ["session", "bearer", "api-key"])

export default defineMiddlewares({
  routes: [
    {
      matcher: /^\/auth\/(user|mfa|session)(\/.*)?$/,
      middlewares: [captureAuditTrail],
    },
    {
      matcher: "/auth/session",
      methods: ["DELETE"],
      middlewares: [revokeMfaAssurance],
    },
    {
      matcher: /^\/admin(\/.*)?$/,
      methods: ["POST", "PUT", "PATCH", "DELETE"],
      middlewares: [captureAuditTrail, requireMfaStepUp],
    },
    {
      matcher: "/admin/security/mfa/challenges",
      methods: ["POST"],
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/security/mfa/challenges/:id/verify",
      methods: ["POST"],
      middlewares: [
        adminAuthentication,
        validateAndTransformBody(VerifyMfaStepUpSchema),
      ],
    },
    {
      matcher: "/admin/security/audit-events",
      methods: ["GET"],
      middlewares: [
        adminAuthentication,
        requireMfaStepUp,
        validateAndTransformQuery(ListAuditEventsSchema, {
          defaults: [
            "id",
            "correlation_id",
            "actor_id",
            "actor_type",
            "auth_identity_id",
            "action",
            "resource_type",
            "resource_id",
            "request_method",
            "request_path",
            "outcome",
            "status_code",
            "before",
            "after",
            "metadata",
            "integrity_nonce",
            "event_hash",
            "occurred_at",
            "created_at",
          ],
          isList: true,
        }),
      ],
      policies: [
        {
          resource: "audit_event",
          operation: PolicyOperation.read,
        },
      ],
    },
  ],
})
