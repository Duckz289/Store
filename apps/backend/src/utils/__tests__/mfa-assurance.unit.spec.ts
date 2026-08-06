import type { MedusaRequest } from "@medusajs/framework/http"

import {
  getCredentialFingerprint,
  getMfaStepUpTtlSeconds,
  hasValidMfaAssurance,
} from "../mfa-assurance"

describe("MFA assurance", () => {
  const originalTtl = process.env.MFA_STEP_UP_TTL_SECONDS

  afterEach(() => {
    if (originalTtl === undefined) {
      delete process.env.MFA_STEP_UP_TTL_SECONDS
    } else {
      process.env.MFA_STEP_UP_TTL_SECONDS = originalTtl
    }
  })

  it("fingerprints bearer and session credentials without returning them", () => {
    const bearer = getCredentialFingerprint({
      headers: { authorization: "Bearer top-secret" },
    } as unknown as MedusaRequest)
    const session = getCredentialFingerprint({
      headers: {},
      sessionID: "session-secret",
    } as unknown as MedusaRequest)

    expect(bearer).toEqual({
      hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      kind: "bearer",
    })
    expect(session).toEqual({
      hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      kind: "session",
    })
    expect(bearer?.hash).not.toContain("top-secret")
    expect(session?.hash).not.toContain("session-secret")
  })

  it("does not allow a secret API key to satisfy human MFA", () => {
    expect(
      getCredentialFingerprint({
        headers: { authorization: "Basic secret-key" },
        secret_key_context: { created_by: "user_123" },
      } as unknown as MedusaRequest)
    ).toBeNull()
  })

  it("rejects revoked and expired assurance", () => {
    const now = new Date("2026-08-06T10:00:00.000Z")

    expect(
      hasValidMfaAssurance(
        [
          {
            expires_at: "2026-08-06T10:10:00.000Z",
            revoked_at: null,
          },
        ],
        now
      )
    ).toBe(true)
    expect(
      hasValidMfaAssurance(
        [
          {
            expires_at: "2026-08-06T10:10:00.000Z",
            revoked_at: "2026-08-06T09:59:00.000Z",
          },
          {
            expires_at: "2026-08-06T09:59:00.000Z",
            revoked_at: null,
          },
        ],
        now
      )
    ).toBe(false)
  })

  it("bounds the assurance lifetime", () => {
    process.env.MFA_STEP_UP_TTL_SECONDS = "1"
    expect(getMfaStepUpTtlSeconds()).toBe(60)

    process.env.MFA_STEP_UP_TTL_SECONDS = "999999"
    expect(getMfaStepUpTtlSeconds()).toBe(3600)

    process.env.MFA_STEP_UP_TTL_SECONDS = "invalid"
    expect(getMfaStepUpTtlSeconds()).toBe(600)
  })
})
