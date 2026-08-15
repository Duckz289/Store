import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

import {
  deleteBrandWorkflow,
  updateBrandWorkflow,
} from "../../../../../workflows/catalog/manage-product-catalog"

export const UpdateCatalogBrandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  handle: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: z.enum(["manufacturer", "store_label", "unspecified"]).optional(),
  logo_url: z.string().trim().url().max(2048).nullable().optional(),
  logo_alt: z.string().trim().max(300).nullable().optional(),
})

type UpdateCatalogBrandBody = z.infer<typeof UpdateCatalogBrandSchema>

export const POST = async (
  req: MedusaRequest<UpdateCatalogBrandBody>,
  res: MedusaResponse
) => {
  const { result } = await updateBrandWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })

  res.json({ brand: result })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  await deleteBrandWorkflow(req.scope).run({ input: req.params.id })
  res.status(200).json({ id: req.params.id, deleted: true })
}
