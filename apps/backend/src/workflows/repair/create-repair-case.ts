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
import {
  generateRepairCode,
  hashPhone,
  normalizeVietnamPhone,
  stableHash,
} from "../../utils/repair-domain"
import { prepareAuditEvent } from "../../utils/security-audit"

export type CreateRepairCaseInput = {
  idempotency_key: string
  actor_type: "customer" | "user"
  actor_id?: string | null
  intake_source: "store" | "admin"
  contact: {
    full_name: string
    phone: string
    email?: string | null
    consented_at: string | Date
  }
  device: {
    device_type: string
    brand?: string | null
    model: string
    color?: string | null
    serial_number?: string | null
    imei?: string | null
    condition_summary: string
    accessories?: string[] | null
    product_title?: string | null
    variant_title?: string | null
    sku?: string | null
    order_display_id?: string | null
    purchased_at?: string | Date | null
    warranty_context?: string | null
  }
  references?: {
    customer_id?: string
    product_id?: string
    variant_id?: string
    order_id?: string
  }
  public_summary?: string | null
  sla_due_at?: string | Date | null
}

const createRepairCaseStep = createStep(
  "create-repair-case",
  async (input: CreateRepairCaseInput, { container }) => {
    const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
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
        const existing = await repairService.retrieveRepairCase(
          receipts[0].result_id,
          { relations: ["contact", "device"] }
        )
        return new StepResponse({ repair_case: existing, replayed: true })
      }

      type RepairCaseRecord = Awaited<
        ReturnType<RepairModuleService["createRepairCases"]>
      >[number]
      let repairCase: RepairCaseRecord | null = null
      const createdLinks: Record<string, Record<string, string>>[] = []

      try {
        let code = ""
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const candidate = generateRepairCode()
          const existing = await repairService.listRepairCases({ code: candidate })
          if (!existing.length) {
            code = candidate
            break
          }
        }
        if (!code) {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            "REPAIR_CODE_GENERATION_FAILED"
          )
        }

        const phone = normalizeVietnamPhone(input.contact.phone)
        repairCase = await repairService.createRepairCases({
          code,
          status: "intake",
          revision: 1,
          intake_source: input.intake_source,
          public_summary: input.public_summary?.trim() || null,
          sla_due_at: input.sla_due_at ? new Date(input.sla_due_at) : null,
        })
        await repairService.createRepairContactSnapshots({
          case_id: repairCase.id,
          full_name: input.contact.full_name.trim(),
          phone_normalized: phone,
          phone_lookup_hash: hashPhone(phone),
          email: input.contact.email?.trim().toLowerCase() || null,
          consented_at: new Date(input.contact.consented_at),
        })
        await repairService.createRepairDeviceSnapshots({
          case_id: repairCase.id,
          device_type: input.device.device_type.trim(),
          brand: input.device.brand?.trim() || null,
          model: input.device.model.trim(),
          color: input.device.color?.trim() || null,
          serial_number: input.device.serial_number?.trim() || null,
          imei: input.device.imei?.trim() || null,
          condition_summary: input.device.condition_summary.trim(),
          accessories: input.device.accessories
            ? { items: input.device.accessories }
            : null,
          product_title: input.device.product_title?.trim() || null,
          variant_title: input.device.variant_title?.trim() || null,
          sku: input.device.sku?.trim() || null,
          order_display_id: input.device.order_display_id?.trim() || null,
          purchased_at: input.device.purchased_at
            ? new Date(input.device.purchased_at)
            : null,
          warranty_context: input.device.warranty_context?.trim() || null,
        })
        await repairService.createRepairStatusHistories({
          case_id: repairCase.id,
          from_status: null,
          to_status: "intake",
          actor_type: input.actor_type,
          actor_id: input.actor_id ?? null,
          idempotency_key: input.idempotency_key,
          sequence: 1,
          occurred_at: new Date(),
        })

        const referenceDefinitions = [
          input.references?.customer_id
            ? {
                repair: { repair_case_id: repairCase.id },
                customer: { customer_id: input.references.customer_id },
              }
            : null,
          input.references?.product_id
            ? {
                repair: { repair_case_id: repairCase.id },
                product: { product_id: input.references.product_id },
              }
            : null,
          input.references?.variant_id
            ? {
                repair: { repair_case_id: repairCase.id },
                product: { product_variant_id: input.references.variant_id },
              }
            : null,
          input.references?.order_id
            ? {
                repair: { repair_case_id: repairCase.id },
                order: { order_id: input.references.order_id },
              }
            : null,
        ].filter(Boolean) as unknown as Record<
          string,
          Record<string, string>
        >[]

        for (const definition of referenceDefinitions) {
          await link.create(definition)
          createdLinks.push(definition)
        }

        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `repair:${repairCase.id}`,
            actor_id: input.actor_id ?? null,
            actor_type: input.actor_type,
            action: "repair.case.created",
            resource_type: "repair_case",
            resource_id: repairCase.id,
            outcome: "success",
            metadata: {
              status: "intake",
              intake_source: input.intake_source,
              references: Object.keys(input.references ?? {}),
            },
          })
        )
        await repairService.createRepairCommandReceipts({
          command_key: input.idempotency_key,
          command_type: "repair.case.create",
          request_hash: requestHash,
          result_type: "repair_case",
          result_id: repairCase.id,
          actor_id: input.actor_id ?? null,
          completed_at: new Date(),
        })

        const created = await repairService.retrieveRepairCase(repairCase.id, {
          relations: ["contact", "device"],
        })
        return new StepResponse({ repair_case: created, replayed: false })
      } catch (error) {
        for (const definition of createdLinks.reverse()) {
          await link.dismiss(definition).catch(() => undefined)
        }
        if (repairCase) {
          const children = await Promise.all([
            repairService.listRepairStatusHistories({ case_id: repairCase.id }),
            repairService.listRepairDeviceSnapshots({ case_id: repairCase.id }),
            repairService.listRepairContactSnapshots({ case_id: repairCase.id }),
          ])
          await repairService
            .deleteRepairStatusHistories(children[0].map((item) => item.id))
            .catch(() => undefined)
          await repairService
            .deleteRepairDeviceSnapshots(children[1].map((item) => item.id))
            .catch(() => undefined)
          await repairService
            .deleteRepairContactSnapshots(children[2].map((item) => item.id))
            .catch(() => undefined)
          await repairService.deleteRepairCases(repairCase.id).catch(() => undefined)
        }
        throw error
      }
      }
    )
    return new StepResponse(response.output)
  }
)

export const createRepairCaseWorkflow = createWorkflow(
  "create-repair-case",
  (input: CreateRepairCaseInput) => {
    const result = createRepairCaseStep(input)
    return new WorkflowResponse(result)
  }
)
