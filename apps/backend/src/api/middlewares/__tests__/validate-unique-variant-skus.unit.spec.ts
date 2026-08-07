import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { validateUniqueVariantSkus } from "../validate-unique-variant-skus"

function createRequest(
  body: unknown,
  records: Array<{ id: string; sku: string }> = [],
  params: Record<string, string> = {}
) {
  const graph = jest.fn().mockResolvedValue({ data: records })
  const request = {
    body,
    params,
    scope: { resolve: jest.fn().mockReturnValue({ graph }) },
  } as unknown as MedusaRequest

  return { graph, request }
}

describe("validateUniqueVariantSkus", () => {
  const response = {} as MedusaResponse

  it("rejects duplicate SKUs in one product request", async () => {
    const { request } = createRequest({
      variants: [{ sku: "DUP-1" }, { sku: "DUP-1" }],
    })
    const next = jest.fn() as jest.MockedFunction<MedusaNextFunction>

    await validateUniqueVariantSkus(request, response, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Each sellable variant must have a unique SKU. Duplicate SKU: DUP-1",
      })
    )
  })

  it("rejects an SKU already assigned to another variant", async () => {
    const { request } = createRequest(
      { sku: "EXISTING-1" },
      [{ id: "variant_existing", sku: "EXISTING-1" }]
    )
    const next = jest.fn() as jest.MockedFunction<MedusaNextFunction>

    await validateUniqueVariantSkus(request, response, next)

    expect(next.mock.calls[0][0]).toEqual(
      expect.objectContaining({ message: expect.stringContaining("EXISTING-1") })
    )
  })

  it("allows a variant to keep its current SKU", async () => {
    const { request } = createRequest(
      { sku: "KEEP-1" },
      [{ id: "variant_keep", sku: "KEEP-1" }],
      { variant_id: "variant_keep" }
    )
    const next = jest.fn() as jest.MockedFunction<MedusaNextFunction>

    await validateUniqueVariantSkus(request, response, next)

    expect(next).toHaveBeenCalledWith()
  })
})
