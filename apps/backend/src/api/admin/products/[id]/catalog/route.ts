import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  catalogMediaAltTextSchema,
  catalogMerchandisingSchema,
  catalogSpecificationsSchema,
} from "../../../../../utils/catalog-schema"
import { upsertProductCatalogWorkflow } from "../../../../../workflows/catalog/manage-product-catalog"

export const UpdateProductCatalogSchema = z.object({
  brand_id: z.string().min(1).nullable().optional(),
  model: z.string().trim().max(160).nullable().optional(),
  specifications: catalogSpecificationsSchema.optional().default([]),
  media_alt_text: catalogMediaAltTextSchema.optional().default({}),
  merchandising: catalogMerchandisingSchema.optional().default({
    categories: {},
    collections: {},
    homepage: {},
  }),
})

type UpdateProductCatalogBody = z.infer<typeof UpdateProductCatalogSchema>

async function retrieveProductCatalog(req: MedusaRequest) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "status",
      "thumbnail",
      "images.*",
      "categories.*",
      "collection.*",
      "catalog.*",
      "catalog.brand.*",
    ],
    filters: { id: req.params.id },
  })

  if (!products[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  return products[0]
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const product = await retrieveProductCatalog(req)
  res.json({ product, catalog: product.catalog ?? null })
}

export const POST = async (
  req: MedusaRequest<UpdateProductCatalogBody>,
  res: MedusaResponse
) => {
  await upsertProductCatalogWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      ...req.validatedBody,
    },
  })

  const product = await retrieveProductCatalog(req)
  res.json({ product, catalog: product.catalog })
}
