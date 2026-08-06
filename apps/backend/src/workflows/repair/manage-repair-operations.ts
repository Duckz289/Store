import type { IInventoryService } from "@medusajs/framework/types"
import type { Link } from "@medusajs/framework/modules-sdk"
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
import { stableHash } from "../../utils/repair-domain"
import { prepareAuditEvent } from "../../utils/security-audit"

type ActorInput = {
  actor_id: string
  idempotency_key: string
}

export type RecordRepairDiagnosisInput = ActorInput & {
  repair_case_id: string
  severity: "low" | "medium" | "high" | "critical"
  findings: string
  recommended_action: string
  internal_note?: string | null
  diagnosed_by_name?: string | null
}

const recordRepairDiagnosisStep = createStep(
  "record-repair-diagnosis",
  async (input: RecordRepairDiagnosisInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const requestHash = stableHash(input)

    const response = await locking.execute(
      [`repair-case:${input.repair_case_id}`, `repair-command:${input.idempotency_key}`],
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
            diagnosis: await repairService.retrieveRepairDiagnosis(
              receipts[0].result_id
            ),
            replayed: true,
          })
        }

        const repairCase = await repairService.retrieveRepairCase(
          input.repair_case_id
        )
        if (repairCase.status !== "diagnosis") {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "REPAIR_DIAGNOSIS_STATUS_REQUIRED"
          )
        }
        const diagnoses = await repairService.listRepairDiagnoses(
          { case_id: repairCase.id },
          { order: { version: "DESC" }, take: 1 }
        )
        const diagnosis = await repairService.createRepairDiagnoses({
          case_id: repairCase.id,
          version: (diagnoses[0]?.version ?? 0) + 1,
          severity: input.severity,
          findings: input.findings.trim(),
          recommended_action: input.recommended_action.trim(),
          internal_note: input.internal_note?.trim() || null,
          diagnosed_by: input.actor_id,
          diagnosed_by_name: input.diagnosed_by_name?.trim() || null,
          completed_at: new Date(),
        })

        try {
          await repairService.createRepairCommandReceipts({
            command_key: input.idempotency_key,
            command_type: "repair.diagnosis.record",
            request_hash: requestHash,
            result_type: "repair_diagnosis",
            result_id: diagnosis.id,
            actor_id: input.actor_id,
            completed_at: new Date(),
          })
          await securityService.createAuditEvents(
            prepareAuditEvent({
              correlation_id: `repair:${repairCase.id}`,
              actor_id: input.actor_id,
              actor_type: "user",
              action: "repair.diagnosis.recorded",
              resource_type: "repair_diagnosis",
              resource_id: diagnosis.id,
              outcome: "success",
              metadata: {
                repair_case_id: repairCase.id,
                version: diagnosis.version,
                severity: diagnosis.severity,
              },
            })
          )
          return new StepResponse({ diagnosis, replayed: false })
        } catch (error) {
          await repairService
            .deleteRepairDiagnoses(diagnosis.id)
            .catch(() => undefined)
          throw error
        }
      }
    )
    return new StepResponse(response.output)
  }
)

export const recordRepairDiagnosisWorkflow = createWorkflow(
  "record-repair-diagnosis",
  (input: RecordRepairDiagnosisInput) =>
    new WorkflowResponse(recordRepairDiagnosisStep(input))
)

export type AssignRepairTechnicianInput = ActorInput & {
  repair_case_id: string
  technician_user_id: string
  technician_name: string
}

const assignRepairTechnicianStep = createStep(
  "assign-repair-technician",
  async (input: AssignRepairTechnicianInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
    const requestHash = stableHash(input)

    const response = await locking.execute(
      [`repair-case:${input.repair_case_id}`, `repair-command:${input.idempotency_key}`],
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
            assignment:
              await repairService.retrieveRepairTechnicianAssignment(
                receipts[0].result_id
              ),
            replayed: true,
          })
        }

        const repairCase = await repairService.retrieveRepairCase(
          input.repair_case_id
        )
        if (["closed", "canceled"].includes(repairCase.status)) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "REPAIR_TERMINAL_CASE_CANNOT_BE_ASSIGNED"
          )
        }
        const now = new Date()
        const active = await repairService.listRepairTechnicianAssignments({
          case_id: repairCase.id,
          ended_at: null,
        })
        const assignment = await repairService.createRepairTechnicianAssignments({
          case_id: repairCase.id,
          technician_user_id: input.technician_user_id,
          technician_name: input.technician_name.trim(),
          assigned_by: input.actor_id,
          assigned_at: now,
          idempotency_key: input.idempotency_key,
        })
        const definition = {
          repair: { repair_technician_assignment_id: assignment.id },
          user: { user_id: input.technician_user_id },
        }

        try {
          if (active.length) {
            await repairService.updateRepairTechnicianAssignments(
              active.map((item) => ({ id: item.id, ended_at: now }))
            )
          }
          await link.create(definition)
          await repairService.createRepairCommandReceipts({
            command_key: input.idempotency_key,
            command_type: "repair.technician.assign",
            request_hash: requestHash,
            result_type: "repair_technician_assignment",
            result_id: assignment.id,
            actor_id: input.actor_id,
            completed_at: now,
          })
          await securityService.createAuditEvents(
            prepareAuditEvent({
              correlation_id: `repair:${repairCase.id}`,
              actor_id: input.actor_id,
              actor_type: "user",
              action: "repair.technician.assigned",
              resource_type: "repair_technician_assignment",
              resource_id: assignment.id,
              outcome: "success",
              metadata: {
                repair_case_id: repairCase.id,
                technician_user_id: input.technician_user_id,
              },
            })
          )
          return new StepResponse({ assignment, replayed: false })
        } catch (error) {
          await link.dismiss(definition).catch(() => undefined)
          await repairService
            .deleteRepairTechnicianAssignments(assignment.id)
            .catch(() => undefined)
          if (active.length) {
            await repairService
              .updateRepairTechnicianAssignments(
                active.map((item) => ({ id: item.id, ended_at: null }))
              )
              .catch(() => undefined)
          }
          throw error
        }
      }
    )
    return new StepResponse(response.output)
  }
)

export const assignRepairTechnicianWorkflow = createWorkflow(
  "assign-repair-technician",
  (input: AssignRepairTechnicianInput) =>
    new WorkflowResponse(assignRepairTechnicianStep(input))
)

export type AddRepairPartUsageInput = ActorInput & {
  repair_case_id: string
  inventory_item_id: string
  location_id: string
  sku?: string | null
  title: string
  quantity: number
}

const addRepairPartUsageStep = createStep(
  "add-repair-part-usage",
  async (input: AddRepairPartUsageInput, { container }) => {
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "REPAIR_PART_QUANTITY_INVALID"
      )
    }

    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const inventoryService = container.resolve<IInventoryService>(
      Modules.INVENTORY
    )
    const locking = container.resolve(Modules.LOCKING)
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
    const requestHash = stableHash(input)

    const response = await locking.execute(
      [
        `repair-case:${input.repair_case_id}`,
        `repair-command:${input.idempotency_key}`,
        input.inventory_item_id,
      ],
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
            part_usage: await repairService.retrieveRepairPartUsage(
              receipts[0].result_id
            ),
            replayed: true,
          })
        }

        const repairCase = await repairService.retrieveRepairCase(
          input.repair_case_id
        )
        if (repairCase.status !== "repair") {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "REPAIR_PART_USAGE_STATUS_REQUIRED"
          )
        }
        const available = await inventoryService.confirmInventory(
          input.inventory_item_id,
          [input.location_id],
          input.quantity
        )
        if (!available) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "REPAIR_PART_INVENTORY_UNAVAILABLE"
          )
        }

        await inventoryService.adjustInventory(
          input.inventory_item_id,
          input.location_id,
          -input.quantity
        )
        let partUsage: Awaited<
          ReturnType<RepairModuleService["createRepairPartUsages"]>
        >[number] | null = null
        const definitions: Record<string, Record<string, string>>[] = []
        try {
          partUsage = await repairService.createRepairPartUsages({
            case_id: repairCase.id,
            status: "applied",
            inventory_item_id: input.inventory_item_id,
            location_id: input.location_id,
            sku: input.sku?.trim() || null,
            title: input.title.trim(),
            quantity: input.quantity,
            applied_at: new Date(),
            idempotency_key: input.idempotency_key,
            actor_id: input.actor_id,
          })
          definitions.push(
            {
              repair: { repair_part_usage_id: partUsage.id },
              inventory: { inventory_item_id: input.inventory_item_id },
            },
            {
              repair: { repair_part_usage_id: partUsage.id },
              stock_location: { stock_location_id: input.location_id },
            }
          )
          for (const definition of definitions) {
            await link.create(definition)
          }
          await repairService.createRepairCommandReceipts({
            command_key: input.idempotency_key,
            command_type: "repair.part.apply",
            request_hash: requestHash,
            result_type: "repair_part_usage",
            result_id: partUsage.id,
            actor_id: input.actor_id,
            completed_at: new Date(),
          })
          await securityService.createAuditEvents(
            prepareAuditEvent({
              correlation_id: `repair:${repairCase.id}`,
              actor_id: input.actor_id,
              actor_type: "user",
              action: "repair.part.applied",
              resource_type: "repair_part_usage",
              resource_id: partUsage.id,
              outcome: "success",
              metadata: {
                repair_case_id: repairCase.id,
                inventory_item_id: input.inventory_item_id,
                location_id: input.location_id,
                quantity: input.quantity,
              },
            })
          )
          return new StepResponse({ part_usage: partUsage, replayed: false })
        } catch (error) {
          for (const definition of definitions.reverse()) {
            await link.dismiss(definition).catch(() => undefined)
          }
          if (partUsage) {
            await repairService
              .deleteRepairPartUsages(partUsage.id)
              .catch(() => undefined)
          }
          await inventoryService
            .adjustInventory(
              input.inventory_item_id,
              input.location_id,
              input.quantity
            )
            .catch(() => undefined)
          throw error
        }
      }
    )
    return new StepResponse(response.output)
  }
)

export const addRepairPartUsageWorkflow = createWorkflow(
  "add-repair-part-usage",
  (input: AddRepairPartUsageInput) =>
    new WorkflowResponse(addRepairPartUsageStep(input))
)

export type ReverseRepairPartUsageInput = ActorInput & {
  repair_case_id: string
  part_usage_id: string
}

const reverseRepairPartUsageStep = createStep(
  "reverse-repair-part-usage",
  async (input: ReverseRepairPartUsageInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const inventoryService = container.resolve<IInventoryService>(
      Modules.INVENTORY
    )
    const locking = container.resolve(Modules.LOCKING)
    const requestHash = stableHash(input)
    const partUsage = await repairService.retrieveRepairPartUsage(
      input.part_usage_id
    )

    const response = await locking.execute(
      [
        `repair-case:${input.repair_case_id}`,
        `repair-command:${input.idempotency_key}`,
        partUsage.inventory_item_id,
      ],
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
          return new StepResponse({ part_usage: partUsage, replayed: true })
        }
        if (
          partUsage.case_id !== input.repair_case_id ||
          partUsage.status !== "applied"
        ) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "REPAIR_PART_USAGE_CANNOT_BE_REVERSED"
          )
        }

        await inventoryService.adjustInventory(
          partUsage.inventory_item_id,
          partUsage.location_id,
          partUsage.quantity
        )
        try {
          const reversed = await repairService.updateRepairPartUsages({
            id: partUsage.id,
            status: "reversed",
            reversed_at: new Date(),
            reversal_key: input.idempotency_key,
          })
          await repairService.createRepairCommandReceipts({
            command_key: input.idempotency_key,
            command_type: "repair.part.reverse",
            request_hash: requestHash,
            result_type: "repair_part_usage",
            result_id: partUsage.id,
            actor_id: input.actor_id,
            completed_at: new Date(),
          })
          await securityService.createAuditEvents(
            prepareAuditEvent({
              correlation_id: `repair:${input.repair_case_id}`,
              actor_id: input.actor_id,
              actor_type: "user",
              action: "repair.part.reversed",
              resource_type: "repair_part_usage",
              resource_id: partUsage.id,
              outcome: "success",
              metadata: {
                repair_case_id: input.repair_case_id,
                inventory_item_id: partUsage.inventory_item_id,
                location_id: partUsage.location_id,
                quantity: partUsage.quantity,
              },
            })
          )
          return new StepResponse({ part_usage: reversed, replayed: false })
        } catch (error) {
          await inventoryService
            .adjustInventory(
              partUsage.inventory_item_id,
              partUsage.location_id,
              -partUsage.quantity
            )
            .catch(() => undefined)
          throw error
        }
      }
    )
    return new StepResponse(response.output)
  }
)

export const reverseRepairPartUsageWorkflow = createWorkflow(
  "reverse-repair-part-usage",
  (input: ReverseRepairPartUsageInput) =>
    new WorkflowResponse(reverseRepairPartUsageStep(input))
)

export type AddRepairAttachmentInput = ActorInput & {
  repair_case_id: string
  file_reference: string
  storage_provider: string
  classification:
    | "intake_photo"
    | "diagnosis_photo"
    | "qa_photo"
    | "handover_document"
  mime_type: string
  size_bytes: number
  checksum: string
}

const addRepairAttachmentStep = createStep(
  "add-repair-attachment",
  async (input: AddRepairAttachmentInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const requestHash = stableHash(input)

    const response = await locking.execute(
      `repair-command:${input.idempotency_key}`,
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
          attachment: await repairService.retrieveRepairAttachment(
            receipts[0].result_id
          ),
          replayed: true,
        })
      }
      const repairCase = await repairService.retrieveRepairCase(
        input.repair_case_id
      )
      if (["closed", "canceled"].includes(repairCase.status)) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "REPAIR_TERMINAL_CASE_ATTACHMENT_DENIED"
        )
      }
      if (
        !Number.isSafeInteger(input.size_bytes) ||
        input.size_bytes <= 0 ||
        input.size_bytes > 20 * 1024 * 1024
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "REPAIR_ATTACHMENT_SIZE_INVALID"
        )
      }
      const attachment = await repairService.createRepairAttachments({
        case_id: repairCase.id,
        file_reference: input.file_reference.trim(),
        storage_provider: input.storage_provider.trim(),
        classification: input.classification,
        mime_type: input.mime_type.trim().toLowerCase(),
        size_bytes: input.size_bytes,
        checksum: input.checksum.trim().toLowerCase(),
        uploaded_by: input.actor_id,
      })
      try {
        await repairService.createRepairCommandReceipts({
          command_key: input.idempotency_key,
          command_type: "repair.attachment.add",
          request_hash: requestHash,
          result_type: "repair_attachment",
          result_id: attachment.id,
          actor_id: input.actor_id,
          completed_at: new Date(),
        })
        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `repair:${repairCase.id}`,
            actor_id: input.actor_id,
            actor_type: "user",
            action: "repair.attachment.added",
            resource_type: "repair_attachment",
            resource_id: attachment.id,
            outcome: "success",
            metadata: {
              repair_case_id: repairCase.id,
              classification: attachment.classification,
              mime_type: attachment.mime_type,
              size_bytes: attachment.size_bytes,
            },
          })
        )
        return new StepResponse({ attachment, replayed: false })
      } catch (error) {
        await repairService
          .deleteRepairAttachments(attachment.id)
          .catch(() => undefined)
        throw error
      }
      }
    )
    return new StepResponse(response.output)
  }
)

export const addRepairAttachmentWorkflow = createWorkflow(
  "add-repair-attachment",
  (input: AddRepairAttachmentInput) =>
    new WorkflowResponse(addRepairAttachmentStep(input))
)
