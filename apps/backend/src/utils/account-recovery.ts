import { createHash } from "node:crypto"

export function hashRecoveryIdentifier(value: string) {
  return createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
}

export function buildCustomerPasswordResetUrl(
  origin: string,
  countryCode: string,
  email: string,
  token: string
) {
  const url = new URL(
    `/${encodeURIComponent(countryCode)}/account/reset-password`,
    origin
  )
  url.searchParams.set("email", email)
  url.searchParams.set("token", token)
  return url.toString()
}
