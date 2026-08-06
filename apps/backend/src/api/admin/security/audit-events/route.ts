import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

import { listAuditEventsWorkflow } from "../../../../workflows/security/list-audit-events"

export const ListAuditEventsSchema = z.object({
  actor_id: z.string().min(1).max(128).optional(),
  correlation_id: z.string().min(1).max(128).optional(),
  resource_type: z.string().min(1).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

type ListAuditEventsQuery = z.infer<typeof ListAuditEventsSchema>

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, ListAuditEventsQuery>,
  res: MedusaResponse
) => {
  const { result } = await listAuditEventsWorkflow(req.scope).run({
    input: req.validatedQuery,
  })

  return res.status(200).json(result)
}
