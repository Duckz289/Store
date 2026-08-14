import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"

import "../policies/security"
import "../policies/repair"
import "../policies/vietqr"
import { ListAuditEventsSchema } from "./admin/security/audit-events/route"
import { VerifyMfaStepUpSchema } from "./admin/security/mfa/challenges/[id]/verify/route"
import { CreateCatalogBrandSchema } from "./admin/catalog/brands/route"
import { UpdateCatalogBrandSchema } from "./admin/catalog/brands/[id]/route"
import { UpdateProductCatalogSchema } from "./admin/products/[id]/catalog/route"
import {
  AddRepairAttachmentSchema,
  AddRepairPartUsageSchema,
  AssignRepairTechnicianSchema,
  CreateAdminRepairSchema,
  CreateStoreRepairSchema,
  DecideRepairQuoteSchema,
  ListAdminRepairsSchema,
  RecordRepairDiagnosisSchema,
  ReverseRepairPartUsageSchema,
  SaveRepairQuoteSchema,
  StoreRepairLookupSchema,
  SubmitRepairQuoteSchema,
  TransitionRepairSchema,
  UploadStoreRepairImageSchema,
} from "./repair-validators"
import { captureAuditTrail } from "./middlewares/audit-trail"
import { blockNativeVietQrRefund } from "./middlewares/block-native-vietqr-refund"
import { auditPasswordRecovery } from "./middlewares/password-recovery-audit"
import { passwordRecoveryRateLimit } from "./middlewares/password-recovery-rate-limit"
import { requireMfaStepUp } from "./middlewares/require-mfa-step-up"
import { repairIntakeRateLimit } from "./middlewares/repair-intake-rate-limit"
import { revokeMfaAssurance } from "./middlewares/revoke-mfa-assurance"
import { validateUniqueVariantSkus } from "./middlewares/validate-unique-variant-skus"
import {
  ConfirmVietQrPaymentSchema,
  RefundVietQrPaymentSchema,
} from "./vietqr-validators"

const adminAuthentication = authenticate("user", [
  "session",
  "bearer",
  "api-key",
])
const customerAuthentication = authenticate("customer", ["session", "bearer"])

const middlewareConfiguration = {
  routes: [
    {
      matcher: "/auth/customer/emailpass/reset-password",
      methods: ["POST"],
      middlewares: [auditPasswordRecovery, passwordRecoveryRateLimit],
    },
    {
      matcher: "/auth/customer/emailpass/update",
      methods: ["POST"],
      middlewares: [auditPasswordRecovery, passwordRecoveryRateLimit],
    },
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
      matcher: "/admin/products",
      methods: ["POST"],
      middlewares: [validateUniqueVariantSkus],
    },
    {
      matcher: "/admin/products/:id",
      methods: ["POST"],
      middlewares: [validateUniqueVariantSkus],
    },
    {
      matcher: "/admin/products/:id/variants",
      methods: ["POST"],
      middlewares: [validateUniqueVariantSkus],
    },
    {
      matcher: "/admin/products/:id/variants/:variant_id",
      methods: ["POST"],
      middlewares: [validateUniqueVariantSkus],
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
    {
      matcher: "/admin/catalog/brands",
      methods: ["GET"],
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/catalog/brands/:id",
      methods: ["POST"],
      middlewares: [
        adminAuthentication,
        validateAndTransformBody(UpdateCatalogBrandSchema),
      ],
    },
    {
      matcher: "/admin/catalog/brands/:id",
      methods: ["DELETE"],
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/catalog/brands",
      methods: ["POST"],
      middlewares: [
        adminAuthentication,
        validateAndTransformBody(CreateCatalogBrandSchema),
      ],
    },
    {
      matcher: "/admin/products/:id/catalog",
      methods: ["GET"],
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/products/:id/catalog",
      methods: ["POST"],
      middlewares: [
        adminAuthentication,
        validateAndTransformBody(UpdateProductCatalogSchema),
      ],
    },
    {
      matcher: "/admin/products/:id/preview",
      methods: ["POST"],
      middlewares: [adminAuthentication],
    },
    {
      matcher: /^\/admin\/repairs(\/.*)?$/,
      middlewares: [adminAuthentication],
    },
    {
      matcher: "/admin/repairs",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(ListAdminRepairsSchema, {
          defaults: ["id", "code", "status", "created_at"],
          isList: true,
        }),
      ],
      policies: [{ resource: "repair_case", operation: "read" }],
    },
    {
      matcher: "/admin/repairs",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(CreateAdminRepairSchema)],
      policies: [{ resource: "repair_case", operation: "create" }],
    },
    {
      matcher: "/admin/repairs/:id",
      methods: ["GET"],
      policies: [{ resource: "repair_case", operation: "read" }],
    },
    {
      matcher: "/admin/repairs/:id/contact",
      methods: ["GET"],
      policies: [{ resource: "repair_contact", operation: "read_sensitive" }],
    },
    {
      matcher: "/admin/repairs/:id/transitions",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(TransitionRepairSchema)],
      policies: [{ resource: "repair_case", operation: "transition" }],
    },
    {
      matcher: "/admin/repairs/:id/diagnoses",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(RecordRepairDiagnosisSchema)],
      policies: [{ resource: "repair_diagnosis", operation: "create" }],
    },
    {
      matcher: "/admin/repairs/:id/quotes",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(SaveRepairQuoteSchema)],
      policies: [{ resource: "repair_quote", operation: "create" }],
    },
    {
      matcher: "/admin/repairs/:id/quotes/:quoteId/submit",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(SubmitRepairQuoteSchema)],
      policies: [{ resource: "repair_quote", operation: "submit" }],
    },
    {
      matcher: "/admin/repairs/:id/assignments",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AssignRepairTechnicianSchema)],
      policies: [{ resource: "repair_assignment", operation: "create" }],
    },
    {
      matcher: "/admin/repairs/:id/parts",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AddRepairPartUsageSchema)],
      policies: [{ resource: "repair_part_usage", operation: "create" }],
    },
    {
      matcher: "/admin/repairs/:id/parts/:partId/reverse",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(ReverseRepairPartUsageSchema)],
      policies: [{ resource: "repair_part_usage", operation: "reverse" }],
    },
    {
      matcher: "/admin/repairs/:id/attachments",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AddRepairAttachmentSchema)],
      policies: [{ resource: "repair_attachment", operation: "create" }],
    },
    {
      matcher: "/admin/orders/:id/repairs",
      methods: ["GET"],
      middlewares: [adminAuthentication],
      policies: [{ resource: "repair_case", operation: "read" }],
    },
    {
      matcher: "/admin/orders/:id/vietqr/confirm",
      methods: ["POST"],
      middlewares: [
        adminAuthentication,
        validateAndTransformBody(ConfirmVietQrPaymentSchema),
      ],
      policies: [{ resource: "vietqr_payment", operation: "confirm" }],
    },
    {
      matcher: "/admin/orders/:id/vietqr",
      methods: ["GET"],
      middlewares: [adminAuthentication],
      policies: [{ resource: "vietqr_payment", operation: "read" }],
    },
    {
      matcher: "/admin/payments/:id/vietqr/refund",
      methods: ["POST"],
      middlewares: [
        adminAuthentication,
        validateAndTransformBody(RefundVietQrPaymentSchema),
      ],
      policies: [{ resource: "vietqr_payment", operation: "refund" }],
    },
    {
      matcher: "/admin/payments/:id/refund",
      methods: ["POST"],
      middlewares: [blockNativeVietQrRefund],
    },
    {
      matcher: "/store/repairs",
      methods: ["POST"],
      middlewares: [
        repairIntakeRateLimit,
        validateAndTransformBody(CreateStoreRepairSchema),
      ],
    },
    {
      matcher: "/store/repair-uploads",
      methods: ["POST"],
      bodyParser: { sizeLimit: "13mb" },
      middlewares: [
        repairIntakeRateLimit,
        validateAndTransformBody(UploadStoreRepairImageSchema),
      ],
    },
    {
      matcher: "/store/orders/:id",
      methods: ["GET"],
      middlewares: [customerAuthentication],
    },
    {
      matcher: "/store/repairs/:code",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(StoreRepairLookupSchema, {
          defaults: ["phone"],
          isList: false,
        }),
      ],
    },
    {
      matcher: "/store/repairs/:code/quote-decisions",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(DecideRepairQuoteSchema)],
    },
  ],
}

// Medusa 2.18 executes route-level `policies`, but its public middleware
// configuration type doesn't include that runtime-supported property yet.
export default defineMiddlewares(
  middlewareConfiguration as Parameters<typeof defineMiddlewares>[0],
)
