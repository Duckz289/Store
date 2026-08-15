import type {
  IInventoryService,
  IStockLocationService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import { SECURITY_MODULE } from "../../src/modules/security"
import SecurityModuleService from "../../src/modules/security/service"
import { adjustInventoryStockWorkflow } from "../../src/workflows/inventory/adjust-inventory-stock"

jest.setTimeout(120_000)

medusaIntegrationTestRunner({
  inApp: true,
  testSuite: ({ getContainer }) => {
    it("adjusts inventory atomically and replays an idempotency key once", async () => {
      const container = getContainer()
      const stockLocationService = container.resolve<IStockLocationService>(
        Modules.STOCK_LOCATION
      )
      const inventoryService = container.resolve<IInventoryService>(
        Modules.INVENTORY
      )
      const securityService = container.resolve<SecurityModuleService>(
        SECURITY_MODULE
      )
      const location = await stockLocationService.createStockLocations({
        name: "Inventory Adjustment Test",
      })
      const item = await inventoryService.createInventoryItems({
        sku: "QA-ADJUSTMENT-01",
        title: "QA Adjustment Item",
      })
      const receivingInput = {
        inventory_item_id: item.id,
        location_id: location.id,
        delta: 10,
        reason: "receiving" as const,
        note: "Integration receiving",
        actor_id: "user_inventory_test",
        idempotency_key: "inventory-adjustment-receive-01",
      }

      const receiving = await adjustInventoryStockWorkflow(container).run({
        input: receivingInput,
      })
      const replay = await adjustInventoryStockWorkflow(container).run({
        input: receivingInput,
      })
      expect(receiving.result.replayed).toBe(false)
      expect(replay.result.replayed).toBe(true)
      expect(
        Number(
          await inventoryService.retrieveStockedQuantity(item.id, [location.id])
        )
      ).toBe(10)

      await adjustInventoryStockWorkflow(container).run({
        input: {
          ...receivingInput,
          delta: -4,
          reason: "correction",
          idempotency_key: "inventory-adjustment-correction-01",
        },
      })
      expect(
        Number(
          await inventoryService.retrieveStockedQuantity(item.id, [location.id])
        )
      ).toBe(6)
      expect(
        await securityService.listAuditEvents({
          resource_id: item.id,
          action: "inventory.stock.adjusted",
        })
      ).toHaveLength(2)
    })
  },
})
