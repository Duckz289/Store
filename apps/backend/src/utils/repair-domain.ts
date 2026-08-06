import { createHash, randomBytes } from "node:crypto"

import { MedusaError } from "@medusajs/framework/utils"

export const REPAIR_STATUSES = [
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
] as const

export type RepairStatus = (typeof REPAIR_STATUSES)[number]

export const REPAIR_REASON_CODES = [
  "early_cancel",
  "repair_not_feasible",
  "duplicate_intake",
  "customer_revision_requested",
  "quote_expired",
  "qa_failed",
  "repair_completed",
  "handover_completed",
  "case_completed",
] as const

export type RepairReasonCode = (typeof REPAIR_REASON_CODES)[number]

const allowedTransitions: Record<RepairStatus, RepairStatus[]> = {
  intake: ["diagnosis", "canceled"],
  diagnosis: ["quote", "canceled"],
  quote: ["awaiting_customer_decision", "canceled"],
  awaiting_customer_decision: ["repair", "quote", "return_ready"],
  repair: ["quality_assurance"],
  quality_assurance: ["repair", "return_ready"],
  return_ready: ["returned"],
  returned: ["closed"],
  closed: [],
  canceled: [],
}

export type TransitionFacts = {
  hasSubmittedQuote?: boolean
  hasApprovedQuote?: boolean
  hasPendingParts?: boolean
  hasQaEvidence?: boolean
  hasHandoverEvidence?: boolean
}

export function assertRepairTransition(
  from: RepairStatus,
  to: RepairStatus,
  facts: TransitionFacts = {}
) {
  if (!allowedTransitions[from].includes(to)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `REPAIR_TRANSITION_NOT_ALLOWED:${from}:${to}`
    )
  }

  if (to === "awaiting_customer_decision" && !facts.hasSubmittedQuote) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_SUBMITTED_QUOTE_REQUIRED"
    )
  }
  if (to === "repair" && !facts.hasApprovedQuote) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_APPROVED_QUOTE_REQUIRED"
    )
  }
  if (to === "return_ready" && from === "quality_assurance" && !facts.hasQaEvidence) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_QA_EVIDENCE_REQUIRED"
    )
  }
  if (to === "returned" && !facts.hasHandoverEvidence) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_HANDOVER_EVIDENCE_REQUIRED"
    )
  }
  if (["returned", "closed", "canceled"].includes(to) && facts.hasPendingParts) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_PENDING_PART_USAGE"
    )
  }
}

export type QuoteLineInput = {
  kind: "service" | "part" | "labor" | "discount"
  title: string
  sku?: string | null
  quantity: number
  unit_price: number
  internal_cost?: number | null
}

export function calculateQuote(lines: QuoteLineInput[]) {
  if (!lines.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_QUOTE_ITEMS_REQUIRED"
    )
  }

  const items = lines.map((line, position) => {
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "REPAIR_QUOTE_QUANTITY_INVALID"
      )
    }
    if (!Number.isSafeInteger(line.unit_price)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "REPAIR_QUOTE_PRICE_INVALID"
      )
    }
    if (line.kind !== "discount" && line.unit_price < 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "REPAIR_QUOTE_PRICE_INVALID"
      )
    }
    if (line.kind === "discount" && line.unit_price > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "REPAIR_QUOTE_DISCOUNT_INVALID"
      )
    }

    return {
      ...line,
      title: line.title.trim(),
      line_total: line.quantity * line.unit_price,
      position,
    }
  })
  const total = items.reduce((sum, item) => sum + item.line_total, 0)
  if (total < 0 || !Number.isSafeInteger(total)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_QUOTE_TOTAL_INVALID"
    )
  }

  return { items, subtotal: total, total }
}

export function stableHash(value: unknown): string {
  const normalize = (entry: unknown): unknown => {
    if (Array.isArray(entry)) {
      return entry.map(normalize)
    }
    if (entry && typeof entry === "object") {
      return Object.fromEntries(
        Object.entries(entry as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalize(nested)])
      )
    }
    return entry
  }

  return createHash("sha256")
    .update(JSON.stringify(normalize(value)))
    .digest("hex")
}

export function normalizeVietnamPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  const normalized = digits.startsWith("84")
    ? `0${digits.slice(2)}`
    : digits

  if (!/^0\d{9}$/.test(normalized)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "REPAIR_PHONE_INVALID"
    )
  }

  return normalized
}

export function hashPhone(phone: string): string {
  return createHash("sha256").update(normalizeVietnamPhone(phone)).digest("hex")
}

export function generateRepairCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(8)
  let code = "SC-"
  for (const byte of bytes) {
    code += alphabet[byte % alphabet.length]
  }
  return code
}

export function generateCapabilityToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, token_hash: stableHash(token) }
}

export function maskSensitiveIdentifier(value?: string | null) {
  if (!value) {
    return null
  }
  return value.length <= 4
    ? "*".repeat(value.length)
    : `${"*".repeat(value.length - 4)}${value.slice(-4)}`
}
