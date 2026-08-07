import { createHmac, timingSafeEqual } from "crypto"
import { MedusaError } from "@medusajs/framework/utils"

const TOKEN_VERSION = 1
export const PRODUCT_PREVIEW_TTL_SECONDS = 5 * 60

export type ProductPreviewTokenPayload = {
  version: number
  product_id: string
  actor_id: string
  expires_at: number
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function sign(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url")
}

export function getProductPreviewSecret() {
  const secret =
    process.env.PRODUCT_PREVIEW_SECRET ?? process.env.COOKIE_SECRET ?? ""

  if (secret.length < 32) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "PRODUCT_PREVIEW_SECRET or COOKIE_SECRET must be at least 32 characters"
    )
  }

  return secret
}

export function issueProductPreviewToken(input: {
  product_id: string
  actor_id: string
  secret: string
  now?: number
  ttl_seconds?: number
}) {
  const now = input.now ?? Math.floor(Date.now() / 1000)
  const payload: ProductPreviewTokenPayload = {
    version: TOKEN_VERSION,
    product_id: input.product_id,
    actor_id: input.actor_id,
    expires_at: now + (input.ttl_seconds ?? PRODUCT_PREVIEW_TTL_SECONDS),
  }
  const encodedPayload = encode(JSON.stringify(payload))

  return `${encodedPayload}.${sign(encodedPayload, input.secret)}`
}

export function verifyProductPreviewToken(input: {
  token: string
  product_id: string
  secret: string
  now?: number
}) {
  const [encodedPayload, signature, ...extra] = input.token.split(".")

  if (!encodedPayload || !signature || extra.length) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Invalid product preview token"
    )
  }

  const expectedSignature = sign(encodedPayload, input.secret)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Invalid product preview token"
    )
  }

  let payload: ProductPreviewTokenPayload
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    )
  } catch {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Invalid product preview token"
    )
  }

  const now = input.now ?? Math.floor(Date.now() / 1000)
  if (
    payload.version !== TOKEN_VERSION ||
    payload.product_id !== input.product_id ||
    !payload.actor_id ||
    !Number.isInteger(payload.expires_at) ||
    payload.expires_at <= now
  ) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Invalid or expired product preview token"
    )
  }

  return payload
}
