import { z } from "@medusajs/framework/zod"

const idempotencyKey = z.string().min(8).max(128)
const optionalReference = z.string().min(1).max(128).optional()

export const RepairContactSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  phone: z.string().min(9).max(24),
  email: z.string().email().max(254).nullish(),
  consented_at: z.string().datetime(),
})

export const RepairDeviceSchema = z.object({
  device_type: z.string().trim().min(2).max(80),
  brand: z.string().trim().max(120).nullish(),
  model: z.string().trim().min(1).max(160),
  color: z.string().trim().max(80).nullish(),
  serial_number: z.string().trim().max(160).nullish(),
  imei: z.string().trim().max(32).nullish(),
  condition_summary: z.string().trim().min(3).max(4000),
  accessories: z.array(z.string().trim().min(1).max(160)).max(30).nullish(),
  product_title: z.string().trim().max(256).nullish(),
  variant_title: z.string().trim().max(256).nullish(),
  sku: z.string().trim().max(128).nullish(),
  order_display_id: z.string().trim().max(128).nullish(),
  purchased_at: z.string().datetime().nullish(),
  warranty_context: z.string().trim().max(2000).nullish(),
})

export const CreateAdminRepairSchema = z.object({
  idempotency_key: idempotencyKey,
  contact: RepairContactSchema,
  device: RepairDeviceSchema,
  references: z
    .object({
      customer_id: optionalReference,
      product_id: optionalReference,
      variant_id: optionalReference,
      order_id: optionalReference,
    })
    .optional(),
  public_summary: z.string().trim().max(2000).nullish(),
  sla_due_at: z.string().datetime().nullish(),
})

export const CreateStoreRepairSchema = CreateAdminRepairSchema.omit({
  references: true,
})

export const ListAdminRepairsSchema = z.object({
  status: z
    .enum([
      "intake",
      "diagnosis",
      "quote",
      "awaiting_customer_decision",
      "repair",
      "quality_assurance",
      "return_ready",
      "returned",
      "closed",
      "canceled",
    ])
    .optional(),
  q: z.string().trim().min(2).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
})

export const StoreRepairLookupSchema = z.object({
  phone: z.string().min(9).max(24),
})

export const TransitionRepairSchema = z.object({
  to_status: z.enum([
    "diagnosis",
    "quote",
    "repair",
    "quality_assurance",
    "return_ready",
    "returned",
    "closed",
    "canceled",
  ]),
  idempotency_key: idempotencyKey,
  expected_revision: z.number().int().positive().optional(),
  reason_code: z
    .enum([
      "early_cancel",
      "repair_not_feasible",
      "duplicate_intake",
      "customer_revision_requested",
      "quote_expired",
      "qa_failed",
      "repair_completed",
      "handover_completed",
      "case_completed",
    ])
    .nullish(),
  public_note: z.string().trim().max(2000).nullish(),
  evidence: z.record(z.string(), z.unknown()).nullish(),
})

export const RecordRepairDiagnosisSchema = z.object({
  idempotency_key: idempotencyKey,
  severity: z.enum(["low", "medium", "high", "critical"]),
  findings: z.string().trim().min(3).max(10000),
  recommended_action: z.string().trim().min(3).max(10000),
  internal_note: z.string().trim().max(10000).nullish(),
  diagnosed_by_name: z.string().trim().max(160).nullish(),
})

export const SaveRepairQuoteSchema = z.object({
  idempotency_key: idempotencyKey,
  quote_id: optionalReference,
  currency_code: z.string().trim().length(3),
  diagnosis_version: z.number().int().positive(),
  items: z
    .array(
      z.object({
        kind: z.enum(["service", "part", "labor", "discount"]),
        title: z.string().trim().min(1).max(500),
        sku: z.string().trim().max(128).nullish(),
        quantity: z.number().int().positive(),
        unit_price: z.number().int(),
        internal_cost: z.number().int().nonnegative().nullish(),
      })
    )
    .min(1)
    .max(100),
})

export const SubmitRepairQuoteSchema = z.object({
  idempotency_key: idempotencyKey,
  expires_in_hours: z.number().int().min(1).max(720).optional(),
})

export const DecideRepairQuoteSchema = z.object({
  idempotency_key: idempotencyKey,
  decision_token: z.string().min(32).max(256),
  decision: z.enum(["approved", "rejected"]),
  evidence: z.string().trim().max(1000).nullish(),
})

export const AssignRepairTechnicianSchema = z.object({
  idempotency_key: idempotencyKey,
  technician_user_id: z.string().min(1).max(128),
  technician_name: z.string().trim().min(2).max(160),
})

export const AddRepairPartUsageSchema = z.object({
  idempotency_key: idempotencyKey,
  inventory_item_id: z.string().min(1).max(128),
  location_id: z.string().min(1).max(128),
  sku: z.string().trim().max(128).nullish(),
  title: z.string().trim().min(1).max(500),
  quantity: z.number().int().positive().max(100000),
})

export const ReverseRepairPartUsageSchema = z.object({
  idempotency_key: idempotencyKey,
})

export const AddRepairAttachmentSchema = z.object({
  idempotency_key: idempotencyKey,
  file_reference: z.string().trim().min(1).max(1000),
  storage_provider: z.string().trim().min(1).max(128),
  classification: z.enum([
    "intake_photo",
    "diagnosis_photo",
    "qa_photo",
    "handover_document",
  ]),
  mime_type: z.string().trim().min(3).max(128),
  size_bytes: z.number().int().positive().max(20 * 1024 * 1024),
  checksum: z.string().trim().regex(/^[a-fA-F0-9]{64}$/),
})
