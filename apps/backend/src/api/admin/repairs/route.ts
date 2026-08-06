import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { REPAIR_MODULE } from "../../../modules/repair"
import RepairModuleService from "../../../modules/repair/service"
import { presentRepairCase } from "../../../utils/repair-presentation"
import { createRepairCaseWorkflow } from "../../../workflows/repair/create-repair-case"
import {
  CreateAdminRepairSchema,
  ListAdminRepairsSchema,
} from "../../repair-validators"

type CreateAdminRepairBody = z.infer<typeof CreateAdminRepairSchema>
type ListAdminRepairsQuery = z.infer<typeof ListAdminRepairsSchema>

export const GET = async (
  req: AuthenticatedMedusaRequest<unknown, ListAdminRepairsQuery>,
  res: MedusaResponse
) => {
  const repairService = req.scope.resolve<RepairModuleService>(REPAIR_MODULE)
  const filters: Record<string, unknown> = {}
  if (req.validatedQuery.status) {
    filters.status = req.validatedQuery.status
  }
  if (req.validatedQuery.q) {
    filters.q = req.validatedQuery.q
  }
  const [cases, count] = await repairService.listAndCountRepairCases(filters, {
    relations: ["device"],
    order: { created_at: "DESC" },
    skip: req.validatedQuery.offset,
    take: req.validatedQuery.limit,
  })

  return res.status(200).json({
    repair_cases: cases.map(presentRepairCase),
    count,
    limit: req.validatedQuery.limit,
    offset: req.validatedQuery.offset,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateAdminRepairBody>,
  res: MedusaResponse
) => {
  const { result } = await createRepairCaseWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      actor_type: "user",
      actor_id: req.auth_context.actor_id,
      intake_source: "admin",
    },
  })

  return res.status(result.replayed ? 200 : 201).json({
    repair_case: presentRepairCase(result.repair_case),
    replayed: result.replayed,
  })
}
