import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { REPAIR_MODULE } from "../../../../modules/repair"
import RepairModuleService from "../../../../modules/repair/service"
import { presentRepairCase } from "../../../../utils/repair-presentation"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const repairService = req.scope.resolve<RepairModuleService>(REPAIR_MODULE)
  const repairCase = await repairService.retrieveRepairCase(req.params.id, {
    relations: [
      "device",
      "diagnoses",
      "quotes",
      "quotes.items",
      "quotes.decisions",
      "parts",
      "assignments",
      "attachments",
      "status_history",
    ],
  })

  return res.status(200).json({
    repair_case: {
      ...presentRepairCase(repairCase),
      diagnoses: repairCase.diagnoses?.map((diagnosis) => ({
        id: diagnosis.id,
        version: diagnosis.version,
        severity: diagnosis.severity,
        findings: diagnosis.findings,
        recommended_action: diagnosis.recommended_action,
        diagnosed_by_name: diagnosis.diagnosed_by_name,
        completed_at: diagnosis.completed_at,
      })),
      quotes: repairCase.quotes?.map((quote) => ({
        id: quote.id,
        version: quote.version,
        status: quote.status,
        currency_code: quote.currency_code,
        subtotal: quote.subtotal,
        total: quote.total,
        diagnosis_version: quote.diagnosis_version,
        valid_until: quote.valid_until,
        submitted_at: quote.submitted_at,
        decided_at: quote.decided_at,
        items: quote.items?.map((item) => ({
          id: item.id,
          kind: item.kind,
          title: item.title,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          position: item.position,
        })),
        decisions: quote.decisions?.map((decision) => ({
          id: decision.id,
          decision: decision.decision,
          decided_at: decision.decided_at,
        })),
      })),
      parts: repairCase.parts,
      assignments: repairCase.assignments,
      attachments: repairCase.attachments,
      status_history: repairCase.status_history,
    },
  })
}
