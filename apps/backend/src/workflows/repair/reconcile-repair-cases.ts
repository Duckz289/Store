import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { REPAIR_MODULE } from "../../modules/repair"
import RepairModuleService from "../../modules/repair/service"
import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { stableHash } from "../../utils/repair-domain"
import { prepareAuditEvent } from "../../utils/security-audit"

type ReconciliationFinding = {
  repair_case_id: string
  issue_type:
    | "status_history_mismatch"
    | "quote_integrity"
    | "pending_part_usage"
    | "terminal_resource_active"
    | "sla_overdue"
    | "retention_due"
  discriminator: string
  details: Record<string, unknown>
}

function quoteContentHash(quote: {
  currency_code: string
  diagnosis_version: number
  total: number
  items?: {
    kind: string
    title: string
    sku: string | null
    quantity: number
    unit_price: number
    line_total: number
    position: number
  }[]
}) {
  return stableHash({
    currency_code: quote.currency_code,
    diagnosis_version: quote.diagnosis_version,
    total: quote.total,
    items: (quote.items ?? []).map((item) => ({
      kind: item.kind,
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
      position: item.position,
    })),
  })
}

const reconcileRepairCasesStep = createStep(
  "reconcile-repair-cases",
  async (_, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const now = new Date()
    const retentionCutoff = new Date(now)
    retentionCutoff.setUTCFullYear(retentionCutoff.getUTCFullYear() - 2)
    const findings: ReconciliationFinding[] = []
    let offset = 0
    const pageSize = 100

    while (true) {
      const [cases, count] = await repairService.listAndCountRepairCases(
        {},
        { skip: offset, take: pageSize, order: { created_at: "ASC" } }
      )

      for (const repairCase of cases) {
        const [history, quotes, pendingParts, activeAssignments, contacts] =
          await Promise.all([
            repairService.listRepairStatusHistories(
              { case_id: repairCase.id },
              { order: { sequence: "DESC" }, take: 1 }
            ),
            repairService.listRepairQuotes(
              { case_id: repairCase.id },
              { relations: ["items"] }
            ),
            repairService.listRepairPartUsages({
              case_id: repairCase.id,
              status: "pending",
            }),
            repairService.listRepairTechnicianAssignments({
              case_id: repairCase.id,
              ended_at: null,
            }),
            repairService.listRepairContactSnapshots({ case_id: repairCase.id }),
          ])

        if (!history.length || history[0].to_status !== repairCase.status) {
          findings.push({
            repair_case_id: repairCase.id,
            issue_type: "status_history_mismatch",
            discriminator: "latest",
            details: {
              case_status: repairCase.status,
              history_status: history[0]?.to_status ?? null,
            },
          })
        }
        for (const quote of quotes.filter((item) => item.content_hash)) {
          if (quote.content_hash !== quoteContentHash(quote)) {
            findings.push({
              repair_case_id: repairCase.id,
              issue_type: "quote_integrity",
              discriminator: quote.id,
              details: { quote_id: quote.id, version: quote.version },
            })
          }
        }
        if (pendingParts.length) {
          findings.push({
            repair_case_id: repairCase.id,
            issue_type: "pending_part_usage",
            discriminator: "pending",
            details: { count: pendingParts.length },
          })
        }
        if (
          ["closed", "canceled"].includes(repairCase.status) &&
          activeAssignments.length
        ) {
          findings.push({
            repair_case_id: repairCase.id,
            issue_type: "terminal_resource_active",
            discriminator: "assignment",
            details: { active_assignments: activeAssignments.length },
          })
        }
        if (
          repairCase.sla_due_at &&
          repairCase.sla_due_at < now &&
          !["returned", "closed", "canceled"].includes(repairCase.status)
        ) {
          findings.push({
            repair_case_id: repairCase.id,
            issue_type: "sla_overdue",
            discriminator: "sla",
            details: { sla_due_at: repairCase.sla_due_at.toISOString() },
          })
        }
        const terminalAt = repairCase.closed_at ?? repairCase.canceled_at
        if (
          terminalAt &&
          terminalAt < retentionCutoff &&
          contacts.some((contact) => !contact.anonymized_at)
        ) {
          findings.push({
            repair_case_id: repairCase.id,
            issue_type: "retention_due",
            discriminator: "contact",
            details: { terminal_at: terminalAt.toISOString() },
          })
        }

        await repairService.updateRepairCases({
          id: repairCase.id,
          last_reconciled_at: now,
        })
      }

      offset += cases.length
      if (!cases.length || offset >= count) {
        break
      }
    }

    const fingerprints = new Set<string>()
    for (const finding of findings) {
      const fingerprint = stableHash({
        repair_case_id: finding.repair_case_id,
        issue_type: finding.issue_type,
        discriminator: finding.discriminator,
      })
      fingerprints.add(fingerprint)
      const existing = await repairService.listRepairReconciliationIssues({
        fingerprint,
      })
      if (existing.length) {
        if (existing[0].status === "resolved") {
          await repairService.updateRepairReconciliationIssues({
            id: existing[0].id,
            status: "open",
            details: finding.details,
            detected_at: now,
            resolved_at: null,
          })
        }
      } else {
        await repairService.createRepairReconciliationIssues({
          repair_case_id: finding.repair_case_id,
          fingerprint,
          issue_type: finding.issue_type,
          status: "open",
          details: finding.details,
          detected_at: now,
        })
      }
    }

    const openIssues = await repairService.listRepairReconciliationIssues({
      status: "open",
    })
    const resolved = openIssues.filter(
      (issue) => !fingerprints.has(issue.fingerprint)
    )
    if (resolved.length) {
      await repairService.updateRepairReconciliationIssues(
        resolved.map((issue) => ({
          id: issue.id,
          status: "resolved" as const,
          resolved_at: now,
        }))
      )
    }

    await securityService.createAuditEvents(
      prepareAuditEvent({
        correlation_id: `repair-reconciliation:${now.toISOString()}`,
        actor_id: "system",
        actor_type: "system",
        action: "repair.reconciliation.completed",
        resource_type: "repair_reconciliation_issue",
        outcome: "success",
        metadata: {
          active_findings: findings.length,
          resolved_findings: resolved.length,
        },
      })
    )

    if (findings.some((finding) => finding.issue_type === "quote_integrity")) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "REPAIR_QUOTE_INTEGRITY_FINDING"
      )
    }

    return new StepResponse({
      active_findings: findings.length,
      resolved_findings: resolved.length,
    })
  }
)

export const reconcileRepairCasesWorkflow = createWorkflow(
  "reconcile-repair-cases",
  () => new WorkflowResponse(reconcileRepairCasesStep())
)
