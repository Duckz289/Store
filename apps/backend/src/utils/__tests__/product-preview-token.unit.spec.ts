import {
  issueProductPreviewToken,
  verifyProductPreviewToken,
} from "../product-preview-token"

const secret = "preview-test-secret-that-is-longer-than-32-characters"

describe("product preview token", () => {
  it("authorizes only the bound product before expiry", () => {
    const token = issueProductPreviewToken({
      product_id: "prod_preview",
      actor_id: "user_admin",
      secret,
      now: 1_000,
      ttl_seconds: 300,
    })

    expect(
      verifyProductPreviewToken({
        token,
        product_id: "prod_preview",
        secret,
        now: 1_299,
      })
    ).toMatchObject({ product_id: "prod_preview", actor_id: "user_admin" })
    expect(() =>
      verifyProductPreviewToken({
        token,
        product_id: "prod_other",
        secret,
        now: 1_100,
      })
    ).toThrow()
    expect(() =>
      verifyProductPreviewToken({
        token,
        product_id: "prod_preview",
        secret,
        now: 1_300,
      })
    ).toThrow(/expired/)
  })

  it("rejects tampering and signing with another secret", () => {
    const token = issueProductPreviewToken({
      product_id: "prod_preview",
      actor_id: "user_admin",
      secret,
      now: 1_000,
    })

    expect(() =>
      verifyProductPreviewToken({
        token: `${token.slice(0, -1)}x`,
        product_id: "prod_preview",
        secret,
        now: 1_001,
      })
    ).toThrow()
    expect(() =>
      verifyProductPreviewToken({
        token,
        product_id: "prod_preview",
        secret: "another-preview-secret-that-is-also-long-enough",
        now: 1_001,
      })
    ).toThrow()
  })
})
