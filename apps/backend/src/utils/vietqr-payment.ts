import { createHash, createHmac, timingSafeEqual } from "crypto"

import { MedusaError } from "@medusajs/framework/utils"

export const VIETQR_PROVIDER_ID = "pp_vietqr_vietqr"
export const VIETQR_SCHEMA_VERSION = 1

export type VietQrProviderOptions = {
  bank_bin: string
  account_number: string
  account_name: string
  confirmation_secret: string
  expiry_minutes?: number
  qr_template?: string
}

export type VietQrPaymentData = {
  schema_version: number
  session_id: string
  reference: string
  expected_amount: string
  currency_code: "vnd"
  bank_bin: string
  account_number: string
  account_name: string
  transfer_content: string
  qr_image_url: string
  created_at: string
  expires_at: string
  intent_hash: string
  confirmation_proof?: string
  bank_transaction_hash?: string
  confirmed_at?: string
  captured_at?: string
  canceled_at?: string
  refunded_at?: string
}

const invalid = (message: string): never => {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
}

export const validateVietQrOptions = (
  options: Record<string, unknown>
): VietQrProviderOptions => {
  const bankBin = String(options.bank_bin ?? "").trim()
  const accountNumber = String(options.account_number ?? "").trim()
  const accountName = String(options.account_name ?? "").trim()
  const secret = String(options.confirmation_secret ?? "")
  const expiryMinutes = Number(options.expiry_minutes ?? 30)
  const template = String(options.qr_template ?? "compact2").trim()

  if (!/^\d{6,8}$/.test(bankBin)) {
    invalid("VIETQR_BANK_BIN must contain 6 to 8 digits")
  }
  if (!/^\d{4,19}$/.test(accountNumber)) {
    invalid("VIETQR_ACCOUNT_NUMBER must contain 4 to 19 digits")
  }
  if (!accountName || accountName.length > 50) {
    invalid("VIETQR_ACCOUNT_NAME must contain 1 to 50 characters")
  }
  if (secret.length < 32) {
    invalid("VIETQR_CONFIRMATION_SECRET must contain at least 32 characters")
  }
  if (!Number.isInteger(expiryMinutes) || expiryMinutes < 5 || expiryMinutes > 1440) {
    invalid("VIETQR_EXPIRY_MINUTES must be an integer from 5 to 1440")
  }
  if (!/^[a-zA-Z0-9_-]{1,20}$/.test(template)) {
    invalid("VIETQR_QR_TEMPLATE is invalid")
  }

  return {
    bank_bin: bankBin,
    account_number: accountNumber,
    account_name: accountName,
    confirmation_secret: secret,
    expiry_minutes: expiryMinutes,
    qr_template: template,
  }
}

export const normalizeVndAmount = (value: unknown): string => {
  let candidate: unknown = value

  if (candidate && typeof candidate === "object") {
    const record = candidate as Record<string, unknown>
    candidate = record.numeric ?? record.value ?? candidate.toString()
  }

  const normalized = String(candidate).trim()
  if (!/^[1-9]\d*$/.test(normalized)) {
    invalid("VietQR amount must be a positive VND integer")
  }
  if (normalized.length > 13) {
    invalid("VietQR amount exceeds the supported 13 digit limit")
  }

  return normalized
}

const hmac = (secret: string, purpose: string, fields: string[]) =>
  createHmac("sha256", secret)
    .update([VIETQR_SCHEMA_VERSION, purpose, ...fields].join("|"))
    .digest("hex")

export const hashBankTransactionReference = (reference: string) =>
  createHash("sha256").update(reference.trim()).digest("hex")

export const hashVietQrCommand = (value: Record<string, unknown>) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex")

export const maskBankReference = (reference: string) => {
  const normalized = reference.trim()
  if (normalized.length <= 6) {
    return "******"
  }

  return `${normalized.slice(0, 3)}***${normalized.slice(-3)}`
}

export const maskAccountNumber = (accountNumber: string) =>
  accountNumber.length <= 4
    ? "****"
    : `${"*".repeat(Math.min(8, accountNumber.length - 4))}${accountNumber.slice(-4)}`

export const classifyVietQrObservation = (input: {
  expected_amount: string
  observed_amount: string
  expected_reference: string
  observed_reference: string
  expires_at: string
  observed_at: string
}) => {
  if (new Date(input.observed_at) > new Date(input.expires_at)) {
    return "expired" as const
  }

  const referencePattern = new RegExp(
    `(^|[^A-Z0-9])${input.expected_reference.toUpperCase()}([^A-Z0-9]|$)`
  )
  if (!referencePattern.test(input.observed_reference.trim().toUpperCase())) {
    return "wrong_reference" as const
  }

  const expected = BigInt(input.expected_amount)
  const observed = BigInt(input.observed_amount)
  if (observed < expected) {
    return "underpaid" as const
  }
  if (observed > expected) {
    return "overpaid" as const
  }

  return "exact" as const
}

export const createVietQrReference = (secret: string, sessionId: string) =>
  `VQ${hmac(secret, "reference", [sessionId]).slice(0, 12).toUpperCase()}`

export const createVietQrIntentHash = (
  secret: string,
  input: Pick<
    VietQrPaymentData,
    | "session_id"
    | "reference"
    | "expected_amount"
    | "currency_code"
    | "bank_bin"
    | "account_number"
    | "expires_at"
  >
) =>
  hmac(secret, "intent", [
    input.session_id,
    input.reference,
    input.expected_amount,
    input.currency_code,
    input.bank_bin,
    input.account_number,
    input.expires_at,
  ])

export const createVietQrConfirmationProof = (
  secret: string,
  input: Pick<
    VietQrPaymentData,
    | "session_id"
    | "reference"
    | "expected_amount"
    | "currency_code"
    | "intent_hash"
  > & { bank_transaction_hash: string }
) =>
  hmac(secret, "confirm", [
    input.session_id,
    input.reference,
    input.expected_amount,
    input.currency_code,
    input.intent_hash,
    input.bank_transaction_hash,
  ])

export const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
}

export const hasValidIntent = (
  secret: string,
  data: VietQrPaymentData
) => safeEqual(data.intent_hash, createVietQrIntentHash(secret, data))

export const hasValidConfirmation = (
  secret: string,
  data: VietQrPaymentData
) => {
  if (!data.confirmation_proof || !data.bank_transaction_hash) {
    return false
  }

  const expected = createVietQrConfirmationProof(secret, {
    ...data,
    bank_transaction_hash: data.bank_transaction_hash,
  })

  return hasValidIntent(secret, data) && safeEqual(data.confirmation_proof, expected)
}

export const buildVietQrImageUrl = (
  options: VietQrProviderOptions,
  amount: string,
  transferContent: string
) => {
  const bankBin = encodeURIComponent(options.bank_bin)
  const account = encodeURIComponent(options.account_number)
  const template = encodeURIComponent(options.qr_template ?? "compact2")
  const query = new URLSearchParams({
    amount,
    addInfo: transferContent,
    accountName: options.account_name,
  })

  return `https://img.vietqr.io/image/${bankBin}-${account}-${template}.png?${query.toString()}`
}

export const asVietQrPaymentData = (
  data: Record<string, unknown> | undefined
): VietQrPaymentData => data as unknown as VietQrPaymentData
