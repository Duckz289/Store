import {
  buildCustomerPasswordResetUrl,
  hashRecoveryIdentifier,
} from "../account-recovery"

describe("account recovery helpers", () => {
  it("hashes identifiers without retaining the original value", () => {
    const digest = hashRecoveryIdentifier(" Customer@Example.Test ")

    expect(digest).toHaveLength(64)
    expect(digest).toMatch(/^[a-f0-9]+$/)
    expect(digest).not.toContain("customer@example.test")
    expect(digest).toBe(hashRecoveryIdentifier("customer@example.test"))
  })

  it("builds reset URLs from configured origin and country", () => {
    const url = buildCustomerPasswordResetUrl(
      "https://shop.example.test/",
      "vn",
      "customer@example.test",
      "token-value"
    )

    expect(url).toBe(
      "https://shop.example.test/vn/account/reset-password?email=customer%40example.test&token=token-value"
    )
  })
})
