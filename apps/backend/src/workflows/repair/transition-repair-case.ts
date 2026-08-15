import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
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
import {
  assertRepairTransition,
  RepairReasonCode,
  RepairStatus,
  stableHash,
} from "../../utils/repair-domain"
import { prepareAuditEvent } from "../../utils/security-audit"
import { hasBusinessOwnerAccess } from "../../utils/role-matrix"

export type TransitionRepairCaseInput = {
  repair_case_id: string
  to_status: RepairStatus
  idempotency_key: string
  actor_type: "customer" | "user" | "system"
  actor_id?: string | null
  expected_revision?: number
  reason_code?: RepairReasonCode | null
  public_note?: string | null
  evidence?: Record<string, unknown> | null
}

const eventByStatus: Partial<Record<RepairStatus, string>> = {
  diagnosis: "repair.case.diagnosis_started",
  quote: "repair.case.quote_started",
  awaiting_customer_decision: "repair.quote.awaiting_decision",
  repair: "repair.case.repair_started",
  quality_assurance: "repair.case.qa_started",
  return_ready: "repair.case.return_ready",
  returned: "repair.case.returned",
  closed: "repair.case.closed",
  canceled: "repair.case.canceled",
}

const transitionRoles: Record<string, string[]> = {
  "intake:diagnosis": ["Support", "Repair Technician"],
  "intake:canceled": ["Support"],
  "diagnosis:quote": ["Repair Technician"],
  "diagnosis:canceled": ["Support"],
  "quote:canceled": ["Support"],
  "awaiting_customer_decision:quote": ["Repair Technician"],
  "repair:quality_assurance": ["Repair Technician"],
  "quality_assurance:repair": ["Repair Technician"],
  "quality_assurance:return_ready": ["Repair Technician"],
  "return_ready:returned": ["Support", "Order & Fulfillment"],
  "returned:closed": ["Support", "Order & Fulfillment"],
}

export const transitionRepairCaseStep = createStep(
  "transition-repair-case",
  async (input: TransitionRepairCaseInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const requestHash = stableHash(input)

    const response = await locking.execute(
      `repair-case:${input.repair_case_id}`,
      async () => {
      const receipts = await repairService.listRepairCommandReceipts({
        command_key: input.idempotency_key,
      })
      if (receipts.length) {
        if (receipts[0].request_hash !== requestHash) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "REPAIR_IDEMPOTENCY_KEY_REUSED"
          )
        }
        return new StepResponse({
          repair_case: await repairService.retrieveRepairCase(
            receipts[0].result_id
          ),
          replayed: true,
        })
      }

      const repairCase = await repairService.retrieveRepairCase(
        input.repair_case_id
      )
      if (input.actor_type !== "user" || !input.actor_id) {
        throw new MedusaError(
          MedusaError.Types.FORBIDDEN,
          "REPAIR_TRANSITION_ACTOR_NOT_ALLOWED"
        )
      }
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: users } = await query.graph({
        entity: "user",
        fields: ["id", "rbac_roles.name"],
        filters: { id: input.actor_id },
      })
      const actorRoles = (
        users[0] as unknown as { rbac_roles?: { name: string }[] }
      )?.rbac_roles?.map((role) => role.name) ?? []
      const isOwner = hasBusinessOwnerAccess(actorRoles)
      const transitionKey = `${repairCase.status}:${input.to_status}`
      const permittedRoles = transitionRoles[transitionKey] ?? []
      if (!isOwner && !permittedRoles.some((role) => actorRoles.includes(role))) {
        throw new MedusaError(
          MedusaError.Types.FORBIDDEN,
          "REPAIR_TRANSITION_ROLE_NOT_ALLOWED"
        )
      }
      if (
        input.expected_revision !== undefined &&
        repairCase.revision !== input.expected_revision
      ) {
        throw new MedusaError(
          MedusaError.Types.CONFLICT,
          "REPAIR_CASE_REVISION_CONFLICT"
        )
      }

      const [
        submittedQuotes,
        approvedQuotes,
        pendingParts,
        appliedParts,
        diagnoses,
        activeAssignments,
      ] = await Promise.all([
        repairService.listRepairQuotes({
          case_id: repairCase.id,
          status: "submitted",
        }),
        repairService.listRepairQuotes({
          case_id: repairCase.id,
          status: "approved",
        }),
        repairService.listRepairPartUsages({
          case_id: repairCase.id,
          status: "pending",
        }),
        repairService.listRepairPartUsages({
          case_id: repairCase.id,
          status: "applied",
        }),
        repairService.listRepairDiagnoses({ case_id: repairCase.id }),
        repairService.listRepairTechnicianAssignments({
          case_id: repairCase.id,
          ended_at: null,
        }),
      ])
      const hasQaEvidence = Boolean(
        input.evidence?.qa_result === "passed" && input.evidence?.checklist
      )
      const hasHandoverEvidence = Boolean(input.evidence?.handover_reference)

      assertRepairTransition(
        repairCase.status as RepairStatus,
        input.to_status,
        {
          hasSubmittedQuote: submittedQuotes.length > 0,
          hasApprovedQuote: approvedQuotes.length > 0,
          hasPendingParts: pendingParts.length > 0,
          hasQaEvidence,
          hasHandoverEvidence,
        }
      )
      if (
        repairCase.status === "intake" &&
        input.to_status === "diagnosis" &&
        !isOwner &&
        !activeAssignments.length
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_ACTIVE_ASSIGNMENT_REQUIRED"
        )
      }
      if (
        repairCase.status === "diagnosis" &&
        input.to_status === "quote" &&
        !diagnoses.length
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_DIAGNOSIS_REQUIRED"
        )
      }
      if (input.to_status === "canceled" && appliedParts.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_APPLIED_PART_USAGE_MUST_BE_REVERSED"
        )
      }
      if (
        input.to_status === "canceled" &&
        !["early_cancel", "repair_not_feasible", "duplicate_intake"].includes(
          input.reason_code ?? ""
        )
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_CANCELLATION_REASON_REQUIRED"
        )
      }
      if (
        repairCase.status === "awaiting_customer_decision" &&
        input.to_status === "quote"
      ) {
        const quote = submittedQuotes[0]
        const expired = Boolean(quote?.valid_until && quote.valid_until <= new Date())
        const customerRequested =
          input.reason_code === "customer_revision_requested"
        if (
          !quote ||
          (!expired && !customerRequested) ||
          (input.reason_code === "quote_expired" && !expired)
        ) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "REPAIR_QUOTE_REVISION_REASON_INVALID"
          )
        }
      }
      if (
        repairCase.status === "repair" &&
        input.to_status === "quality_assurance" &&
        !input.evidence?.work_summary
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_WORK_SUMMARY_REQUIRED"
        )
      }
      if (
        repairCase.status === "quality_assurance" &&
        input.to_status === "repair" &&
        input.evidence?.qa_result !== "failed"
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_QA_FAILURE_REQUIRED"
        )
      }

      const now = new Date()
      const update: Record<string, unknown> = {
        id: repairCase.id,
        status: input.to_status,
        revision: repairCase.revision + 1,
      }
      if (input.to_status === "diagnosis") {
        update.received_at = repairCase.received_at ?? now
      } else if (input.to_status === "quality_assurance") {
        update.repair_completed_at = now
      } else if (input.to_status === "return_ready") {
        update.ready_at = now
      } else if (input.to_status === "returned") {
        update.returned_at = now
      } else if (input.to_status === "closed") {
        update.closed_at = now
      } else if (input.to_status === "canceled") {
        update.canceled_at = now
      }

      let historyId: string | null = null
      let endedAssignmentIds: string[] = []
      let supersededQuoteIds: string[] = []
      let revokedTokenIds: string[] = []
      try {
        if (
          repairCase.status === "awaiting_customer_decision" &&
          input.to_status === "quote"
        ) {
          supersededQuoteIds = submittedQuotes.map((quote) => quote.id)
          await repairService.updateRepairQuotes(
            supersededQuoteIds.map((id) => ({
              id,
              status: "superseded" as const,
            }))
          )
          const tokens = await repairService.listRepairAccessTokens({
            case_id: repairCase.id,
            quote_id: supersededQuoteIds,
            purpose: "quote_decision",
          })
          revokedTokenIds = tokens
            .filter((token) => !token.revoked_at && !token.consumed_at)
            .map((token) => token.id)
          if (revokedTokenIds.length) {
            await repairService.updateRepairAccessTokens(
              revokedTokenIds.map((id) => ({ id, revoked_at: now }))
            )
          }
        }
        const updated = await repairService.updateRepairCases(update)
        if (["closed", "canceled"].includes(input.to_status)) {
          const activeAssignments =
            await repairService.listRepairTechnicianAssignments({
              case_id: repairCase.id,
              ended_at: null,
            })
          endedAssignmentIds = activeAssignments.map((item) => item.id)
          if (endedAssignmentIds.length) {
            await repairService.updateRepairTechnicianAssignments(
              endedAssignmentIds.map((id) => ({ id, ended_at: now }))
            )
          }
        }
        const history = await repairService.createRepairStatusHistories({
          case_id: repairCase.id,
          from_status: repairCase.status,
          to_status: input.to_status,
          actor_type: input.actor_type,
          actor_id: input.actor_id ?? null,
          reason_code: input.reason_code ?? null,
          public_note: input.public_note?.trim() || null,
          metadata: input.evidence ?? null,
          idempotency_key: input.idempotency_key,
          sequence: updated.revision,
          occurred_at: now,
        })
        historyId = history.id
        await repairService.createRepairCommandReceipts({
          command_key: input.idempotency_key,
          command_type: `repair.case.transition.${input.to_status}`,
          request_hash: requestHash,
          result_type: "repair_case",
          result_id: repairCase.id,
          actor_id: input.actor_id ?? null,
          completed_at: now,
        })
        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `repair:${repairCase.id}`,
            actor_id: input.actor_id ?? null,
            actor_type: input.actor_type,
            action: eventByStatus[input.to_status] ?? "repair.case.transitioned",
            resource_type: "repair_case",
            resource_id: repairCase.id,
            outcome: "success",
            before: { status: repairCase.status, revision: repairCase.revision },
            after: { status: updated.status, revision: updated.revision },
            metadata: { reason_code: input.reason_code ?? null },
          })
        )

        return new StepResponse({ repair_case: updated, replayed: false })
      } catch (error) {
        const rollbackReceipts = await repairService.listRepairCommandReceipts({
          command_key: input.idempotency_key,
        })
        if (rollbackReceipts.length) {
          await repairService
            .deleteRepairCommandReceipts(rollbackReceipts.map((item) => item.id))
            .catch(() => undefined)
        }
        if (historyId) {
          await repairService
            .deleteRepairStatusHistories(historyId)
            .catch(() => undefined)
        }
        if (endedAssignmentIds.length) {
          await repairService
            .updateRepairTechnicianAssignments(
              endedAssignmentIds.map((id) => ({ id, ended_at: null }))
            )
            .catch(() => undefined)
        }
        if (revokedTokenIds.length) {
          await repairService
            .updateRepairAccessTokens(
              revokedTokenIds.map((id) => ({ id, revoked_at: null }))
            )
            .catch(() => undefined)
        }
        if (supersededQuoteIds.length) {
          await repairService
            .updateRepairQuotes(
              supersededQuoteIds.map((id) => ({
                id,
                status: "submitted" as const,
              }))
            )
            .catch(() => undefined)
        }
        await repairService
          .updateRepairCases({
            id: repairCase.id,
            status: repairCase.status,
            revision: repairCase.revision,
            received_at: repairCase.received_at,
            repair_completed_at: repairCase.repair_completed_at,
            ready_at: repairCase.ready_at,
            returned_at: repairCase.returned_at,
            closed_at: repairCase.closed_at,
            canceled_at: repairCase.canceled_at,
          })
          .catch(() => undefined)
        throw error
      }
      }
    )
    return new StepResponse(response.output)
  }
)

export const transitionRepairCaseWorkflow = createWorkflow(
  "transition-repair-case",
  (input: TransitionRepairCaseInput) => {
    const result = transitionRepairCaseStep(input)
    return new WorkflowResponse(result)
  }
)
