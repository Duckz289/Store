import type { IInventoryService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { prepareAuditEvent } from "../../utils/security-audit"

export type AdjustInventoryStockInput = {
  inventory_item_id: string
  location_id: string
  delta: number
  reason: "receiving" | "correction" | "damage" | "return"
  note?: string | null
  actor_id: string
  idempotency_key: string
}

const adjustInventoryStockStep = createStep(
  "adjust-inventory-stock",
  async (input: AdjustInventoryStockInput, { container }) => {
    const inventoryService = container.resolve<IInventoryService>(
      Modules.INVENTORY
    )
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)

    const response = await locking.execute(
      `inventory-stock:${input.inventory_item_id}:${input.location_id}`,
      async () => {
        const existingEvents = await securityService.listAuditEvents({
          correlation_id: input.idempotency_key,
          action: "inventory.stock.adjusted",
        })
        if (existingEvents.length) {
          const levels = await inventoryService.listInventoryLevels({
            inventory_item_id: input.inventory_item_id,
            location_id: input.location_id,
          })
          return new StepResponse({
            inventory_level: levels[0],
            replayed: true,
          })
        }

        const levels = await inventoryService.listInventoryLevels({
          inventory_item_id: input.inventory_item_id,
          location_id: input.location_id,
        })
        const current = levels[0]
        const beforeQuantity = Number(current?.stocked_quantity ?? 0)
        const afterQuantity = beforeQuantity + input.delta
        if (afterQuantity < Number(current?.reserved_quantity ?? 0)) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "INVENTORY_ADJUSTMENT_BELOW_RESERVED_QUANTITY"
          )
        }
        if (afterQuantity < 0) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "INVENTORY_ADJUSTMENT_BELOW_ZERO"
          )
        }

        const inventoryLevel = current
          ? await inventoryService.adjustInventory(
              input.inventory_item_id,
              input.location_id,
              input.delta
            )
          : await inventoryService.createInventoryLevels({
              inventory_item_id: input.inventory_item_id,
              location_id: input.location_id,
              stocked_quantity: input.delta,
            })

        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: input.idempotency_key,
            actor_id: input.actor_id,
            actor_type: "user",
            action: "inventory.stock.adjusted",
            resource_type: "inventory_item",
            resource_id: input.inventory_item_id,
            outcome: "success",
            before: { stocked_quantity: beforeQuantity },
            after: { stocked_quantity: afterQuantity },
            metadata: {
              location_id: input.location_id,
              delta: input.delta,
              reason: input.reason,
              note: input.note?.trim() || null,
            },
          })
        )

        return new StepResponse({ inventory_level: inventoryLevel, replayed: false })
      }
    )

    return new StepResponse(response.output)
  }
)

export const adjustInventoryStockWorkflow = createWorkflow(
  "adjust-inventory-stock",
  (input: AdjustInventoryStockInput) =>
    new WorkflowResponse(adjustInventoryStockStep(input))
)
