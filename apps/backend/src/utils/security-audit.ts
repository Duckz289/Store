import { createHash, randomUUID } from "node:crypto"

const SECRET_KEY_PATTERN =
  /authorization|cookie|password|passcode|token|secret|credential|signature|api[-_]?key|recovery[-_]?code|card|cvv/i
const EMAIL_KEY_PATTERN = /email/i
const PHONE_KEY_PATTERN = /phone|mobile/i
const ADDRESS_KEY_PATTERN = /address/i
const REPAIR_SENSITIVE_KEY_PATTERN =
  /full[-_]?name|serial|imei|condition[-_]?summary|accessories|warranty[-_]?context|findings|recommended[-_]?action|internal[-_]?note|file[-_]?reference|checksum/i

const MAX_DEPTH = 6
const MAX_ARRAY_ITEMS = 50
const MAX_OBJECT_KEYS = 100
const MAX_STRING_LENGTH = 512

export type AuditOutcome = "success" | "denied" | "error"

export type AuditEventInput = {
  correlation_id: string
  actor_id?: string | null
  actor_type?: string | null
  auth_identity_id?: string | null
  action: string
  resource_type: string
  resource_id?: string | null
  request_method?: string | null
  request_path?: string | null
  outcome: AuditOutcome
  status_code?: number | null
  before?: unknown
  after?: unknown
  metadata?: unknown
  occurred_at?: Date
}

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue }

function redactString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}<truncated>`
}

function redactValue(value: unknown, key: string, depth: number): JsonValue {
  if (SECRET_KEY_PATTERN.test(key)) {
    return "<redacted:secret>"
  }

  if (EMAIL_KEY_PATTERN.test(key)) {
    return "<redacted:email>"
  }

  if (PHONE_KEY_PATTERN.test(key)) {
    return "<redacted:phone>"
  }

  if (ADDRESS_KEY_PATTERN.test(key)) {
    return "<redacted:address>"
  }

  if (REPAIR_SENSITIVE_KEY_PATTERN.test(key)) {
    return "<redacted:repair-sensitive>"
  }

  if (depth >= MAX_DEPTH) {
    return "<redacted:max-depth>"
  }

  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    return redactString(value)
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => redactValue(item, "", depth + 1))

    if (value.length > MAX_ARRAY_ITEMS) {
      items.push("<truncated:array>")
    }

    return items
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(0, MAX_OBJECT_KEYS)
    const redacted: Record<string, JsonValue> = {}

    for (const [nestedKey, nestedValue] of entries) {
      redacted[nestedKey] = redactValue(nestedValue, nestedKey, depth + 1)
    }

    if (Object.keys(value as Record<string, unknown>).length > MAX_OBJECT_KEYS) {
      redacted.__truncated__ = "<truncated:object>"
    }

    return redacted
  }

  return `<redacted:${typeof value}>`
}

export function redactAuditData(
  value: unknown
): Record<string, JsonValue> | null {
  if (value === undefined) {
    return null
  }

  const redacted = redactValue(value, "", 0)

  if (
    redacted !== null &&
    typeof redacted === "object" &&
    !Array.isArray(redacted)
  ) {
    return redacted
  }

  return { value: redacted }
}

function stableStringify(value: JsonValue): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  const entries = Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right)
  )

  return `{${entries
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(",")}}`
}

export function prepareAuditEvent(input: AuditEventInput) {
  const occurredAt = input.occurred_at ?? new Date()
  const integrityNonce = randomUUID()
  const event = {
    correlation_id: input.correlation_id,
    actor_id: input.actor_id ?? null,
    actor_type: input.actor_type ?? null,
    auth_identity_id: input.auth_identity_id ?? null,
    action: input.action,
    resource_type: input.resource_type,
    resource_id: input.resource_id ?? null,
    request_method: input.request_method ?? null,
    request_path: input.request_path ?? null,
    outcome: input.outcome,
    status_code: input.status_code ?? null,
    before: redactAuditData(input.before),
    after: redactAuditData(input.after),
    metadata: redactAuditData(input.metadata),
    integrity_nonce: integrityNonce,
    occurred_at: occurredAt,
  }
  const hashPayload = redactAuditData({
    ...event,
    occurred_at: occurredAt.toISOString(),
  })
  const eventHash = createHash("sha256")
    .update(stableStringify(hashPayload))
    .digest("hex")

  return {
    ...event,
    event_hash: eventHash,
  }
}

export function verifyAuditEventIntegrity(event: {
  correlation_id: string
  actor_id?: string | null
  actor_type?: string | null
  auth_identity_id?: string | null
  action: string
  resource_type: string
  resource_id?: string | null
  request_method?: string | null
  request_path?: string | null
  outcome: AuditOutcome
  status_code?: number | null
  before?: unknown
  after?: unknown
  metadata?: unknown
  integrity_nonce: string
  occurred_at: Date | string
  event_hash: string
}): boolean {
  const occurredAt =
    event.occurred_at instanceof Date
      ? event.occurred_at.toISOString()
      : new Date(event.occurred_at).toISOString()
  const hashPayload = redactAuditData({
    correlation_id: event.correlation_id,
    actor_id: event.actor_id ?? null,
    actor_type: event.actor_type ?? null,
    auth_identity_id: event.auth_identity_id ?? null,
    action: event.action,
    resource_type: event.resource_type,
    resource_id: event.resource_id ?? null,
    request_method: event.request_method ?? null,
    request_path: event.request_path ?? null,
    outcome: event.outcome,
    status_code: event.status_code ?? null,
    before: event.before ?? null,
    after: event.after ?? null,
    metadata: event.metadata ?? null,
    integrity_nonce: event.integrity_nonce,
    occurred_at: occurredAt,
  })
  const expected = createHash("sha256")
    .update(stableStringify(hashPayload))
    .digest("hex")

  return expected === event.event_hash
}

export function hashCredential(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}
