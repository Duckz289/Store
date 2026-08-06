import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"

import { REPAIR_MODULE } from "../../../../modules/repair"
import RepairModuleService from "../../../../modules/repair/service"
import { hashPhone } from "../../../../utils/repair-domain"
import { presentRepairCase } from "../../../../utils/repair-presentation"
import { StoreRepairLookupSchema } from "../../../repair-validators"

type StoreRepairLookupQuery = z.infer<typeof StoreRepairLookupSchema>

export const GET = async (
  req: MedusaRequest<unknown, StoreRepairLookupQuery>,
  res: MedusaResponse
) => {
  const repairService = req.scope.resolve<RepairModuleService>(REPAIR_MODULE)
  const cases = await repairService.listRepairCases(
    { code: req.params.code.toUpperCase() },
    { relations: ["device", "contact", "quotes", "quotes.decisions"] }
  )
  const repairCase = cases[0]
  if (
    !repairCase ||
    repairCase.contact?.phone_lookup_hash !== hashPhone(req.validatedQuery.phone)
  ) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "REPAIR_CASE_NOT_FOUND")
  }

  return res.status(200).json({
    repair_case: {
      ...presentRepairCase(repairCase),
      quotes: repairCase.quotes?.map((quote) => ({
        id: quote.id,
        version: quote.version,
        status: quote.status,
        currency_code: quote.currency_code,
        total: quote.total,
        valid_until: quote.valid_until,
        decision: quote.decisions?.[0]?.decision ?? null,
      })),
    },
  })
}
