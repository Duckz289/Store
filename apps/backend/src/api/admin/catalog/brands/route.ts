import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { createBrandWorkflow } from "../../../../workflows/catalog/manage-product-catalog"

export const CreateCatalogBrandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  handle: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})

type CreateCatalogBrandBody = z.infer<typeof CreateCatalogBrandSchema>

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: brands } = await query.graph({
    entity: "catalog_brand",
    fields: ["id", "name", "handle", "created_at", "updated_at"],
    pagination: { order: { name: "ASC" } },
  })

  res.json({ brands })
}

export const POST = async (
  req: MedusaRequest<CreateCatalogBrandBody>,
  res: MedusaResponse
) => {
  const { result } = await createBrandWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ brand: result })
}
