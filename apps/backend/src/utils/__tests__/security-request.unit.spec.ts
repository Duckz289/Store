import {
  classifySecurityRequest,
  getCorrelationId,
} from "../security-request"

describe("security request metadata", () => {
  it("preserves only safe caller-provided correlation IDs", () => {
    expect(
      getCorrelationId({
        headers: { "x-request-id": "checkout:request-123" },
      } as never)
    ).toBe("checkout:request-123")
    expect(
      getCorrelationId({
        headers: { "x-request-id": "bad\nheader" },
      } as never)
    ).toMatch(/^[a-f0-9-]{36}$/)
  })

  it("classifies core Admin resources and operations", () => {
    expect(
      classifySecurityRequest(
        "POST",
        "/admin/payment-collections/paycol_123456/capture"
      )
    ).toEqual({
      action: "payment_collection.update",
      resource_type: "payment_collection",
      resource_id: "paycol_123456",
    })
    expect(classifySecurityRequest("DELETE", "/admin/products/prod_123456"))
      .toEqual({
        action: "product.delete",
        resource_type: "product",
        resource_id: "prod_123456",
      })
  })
})
