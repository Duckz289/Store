import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"

import { adjustInventoryStockWorkflow } from "../../../../workflows/inventory/adjust-inventory-stock"

export const AdjustInventoryStockSchema = z.object({
  inventory_item_id: z.string().min(1),
  location_id: z.string().min(1),
  delta: z.number().int().min(-100_000).max(100_000).refine((value) => value !== 0),
  reason: z.enum(["receiving", "correction", "damage", "return"]),
  note: z.string().trim().max(500).nullable().optional(),
  idempotency_key: z.string().min(8).max(128),
})

type AdjustInventoryStockBody = z.infer<typeof AdjustInventoryStockSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<AdjustInventoryStockBody>,
  res: MedusaResponse
) => {
  const actorId = req.auth_context.actor_id
  if (!actorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "UNAUTHORIZED")
  }
  const { result } = await adjustInventoryStockWorkflow(req.scope).run({
    input: { ...req.validatedBody, actor_id: actorId },
  })

  return res.status(200).json(result)
}
