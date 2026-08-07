import {
  createApiKeysWorkflow,
  createProductsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import { issueProductPreviewToken } from "../../src/utils/product-preview-token"

const previewSecret =
  "catalog-http-preview-secret-that-is-longer-than-thirty-two-characters"

jest.setTimeout(120_000)

async function expectStatus(request: Promise<unknown>, status: number) {
  try {
    await request
    throw new Error(`Expected HTTP ${status}`)
  } catch (error: any) {
    expect(error.response?.status).toBe(status)
    return error.response?.data
  }
}

medusaIntegrationTestRunner({
  inApp: true,
  env: { PRODUCT_PREVIEW_SECRET: previewSecret },
  testSuite: ({ api, getContainer }) => {
    let publishableKey = ""
    let salesChannelId = ""

    beforeEach(async () => {
      const container = getContainer()
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: salesChannels } = await query.graph({
        entity: "sales_channel",
        fields: ["id"],
      })

      if (salesChannels[0]) {
        salesChannelId = salesChannels[0].id
      } else {
        const { result } = await createSalesChannelsWorkflow(container).run({
          input: {
            salesChannelsData: [{ name: "Catalog integration" }],
          },
        })
        salesChannelId = result[0].id
      }

      const {
        result: [key],
      } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [
            {
              title: `Catalog integration ${Date.now()}`,
              type: "publishable",
              created_by: "integration-test",
            },
          ],
        },
      })
      publishableKey = key.token
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: key.id, add: [salesChannelId] },
      })
    })

    async function createDraftProduct(suffix: string, sku?: string) {
      const { result } = await createProductsWorkflow(getContainer()).run({
        input: {
          products: [
            {
              title: `Catalog preview ${suffix}`,
              handle: `catalog-preview-${suffix}`,
              status: ProductStatus.DRAFT,
              sales_channels: [{ id: salesChannelId }],
              options: [{ title: "Format", values: ["Default"] }],
              variants: [
                {
                  title: "Default",
                  sku: sku ?? `CATALOG-${suffix.toUpperCase()}`,
                  manage_inventory: false,
                  allow_backorder: false,
                  options: { Format: "Default" },
                  prices: [{ amount: 120_000, currency_code: "vnd" }],
                },
              ],
            },
          ],
        },
      })
      return result[0]
    }

    it("keeps drafts out of Store API while allowing an expiring preview", async () => {
      const product = await createDraftProduct(`draft-${Date.now()}`)
      const storeHeaders = { "x-publishable-api-key": publishableKey }

      await expectStatus(
        api.get(`/store/products/${product.id}`, { headers: storeHeaders }),
        404
      )
      await expectStatus(
        api.get(`/store/catalog/products/${product.id}/preview`, {
          headers: storeHeaders,
        }),
        401
      )
      await expectStatus(api.post(`/admin/products/${product.id}/preview`), 401)

      const token = issueProductPreviewToken({
        product_id: product.id,
        actor_id: "user_catalog_integration",
        secret: previewSecret,
      })
      const preview = await api.get(
        `/store/catalog/products/${product.id}/preview?token=${encodeURIComponent(
          token
        )}`,
        { headers: storeHeaders }
      )

      expect(preview.headers["cache-control"]).toContain("no-store")
      expect(preview.headers["x-robots-tag"]).toContain("noindex")
      expect(preview.data.product.status).toBe(ProductStatus.DRAFT)
      expect(
        preview.data.product.variants[0].calculated_price.calculated_amount
      ).toBe(120_000)
      expect(
        preview.data.product.variants[0].calculated_price.currency_code
      ).toBe("vnd")

      await updateProductsWorkflow(getContainer()).run({
        input: {
          products: [{ id: product.id, status: ProductStatus.PUBLISHED }],
        },
      })
      const published = await api.get(`/store/products/${product.id}`, {
        headers: storeHeaders,
      })
      expect(published.data.product.id).toBe(product.id)
    })

    it("rejects preview tokens bound to another product", async () => {
      const product = await createDraftProduct(`bound-${Date.now()}`)
      const token = issueProductPreviewToken({
        product_id: "prod_other",
        actor_id: "user_catalog_integration",
        secret: previewSecret,
      })

      await expectStatus(
        api.get(
          `/store/catalog/products/${product.id}/preview?token=${encodeURIComponent(
            token
          )}`,
          { headers: { "x-publishable-api-key": publishableKey } }
        ),
        401
      )
    })

  },
})
