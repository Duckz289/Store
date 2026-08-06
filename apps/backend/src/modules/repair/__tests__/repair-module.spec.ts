import { moduleIntegrationTestRunner } from "@medusajs/test-utils"

import { REPAIR_MODULE } from ".."
import RepairModuleService from "../service"

moduleIntegrationTestRunner<RepairModuleService>({
  moduleName: REPAIR_MODULE,
  resolve: "./src/modules/repair",
  testSuite: ({ service }) => {
    it("persists the aggregate, immutable snapshots, and append-only history", async () => {
      const repairCase = await service.createRepairCases({
        code: "SC-MODULE01",
        status: "intake",
        revision: 1,
        intake_source: "admin",
      })
      await service.createRepairContactSnapshots({
        case_id: repairCase.id,
        full_name: "Snapshot Customer",
        phone_normalized: "0909000000",
        phone_lookup_hash: "phone-hash",
        email: "snapshot@example.com",
        consented_at: new Date(),
      })
      await service.createRepairDeviceSnapshots({
        case_id: repairCase.id,
        device_type: "phone",
        brand: "Snapshot Brand",
        model: "Snapshot Model",
        serial_number: "SERIAL-SNAPSHOT",
        condition_summary: "Screen cracked",
        accessories: { items: ["case"] },
      })
      await service.createRepairStatusHistories({
        case_id: repairCase.id,
        from_status: null,
        to_status: "intake",
        actor_type: "user",
        actor_id: "user_test",
        idempotency_key: "module-create-01",
        sequence: 1,
        occurred_at: new Date(),
      })

      const persisted = await service.retrieveRepairCase(repairCase.id, {
        relations: ["contact", "device", "status_history"],
      })
      expect(persisted.contact?.full_name).toBe("Snapshot Customer")
      expect(persisted.device?.model).toBe("Snapshot Model")
      expect(persisted.status_history).toHaveLength(1)
      expect(persisted.status_history?.[0].to_status).toBe("intake")
    })

    it("stores versioned diagnosis and quote snapshots", async () => {
      const repairCase = await service.createRepairCases({
        code: "SC-MODULE02",
        status: "quote",
        revision: 3,
        intake_source: "admin",
      })
      await service.createRepairDiagnoses({
        case_id: repairCase.id,
        version: 1,
        severity: "high",
        findings: "Battery failure",
        recommended_action: "Replace battery",
        diagnosed_by: "user_tech",
        completed_at: new Date(),
      })
      const quote = await service.createRepairQuotes({
        case_id: repairCase.id,
        version: 1,
        status: "draft",
        currency_code: "vnd",
        diagnosis_version: 1,
        subtotal: 500_000,
        total: 500_000,
        created_by: "user_tech",
      })
      await service.createRepairQuoteItems({
        quote_id: quote.id,
        kind: "part",
        title: "Battery",
        sku: "BAT-01",
        quantity: 1,
        unit_price: 500_000,
        line_total: 500_000,
        position: 0,
      })

      const persisted = await service.retrieveRepairCase(repairCase.id, {
        relations: ["diagnoses", "quotes", "quotes.items"],
      })
      expect(persisted.diagnoses?.[0].version).toBe(1)
      expect(persisted.quotes?.[0].items?.[0].sku).toBe("BAT-01")
    })

    it("rejects duplicate status sequence and command keys", async () => {
      const repairCase = await service.createRepairCases({
        code: "SC-MODULE03",
        status: "intake",
        revision: 1,
        intake_source: "store",
      })
      const event = {
        case_id: repairCase.id,
        from_status: null,
        to_status: "intake" as const,
        actor_type: "customer" as const,
        idempotency_key: "duplicate-command",
        sequence: 1,
        occurred_at: new Date(),
      }
      await service.createRepairStatusHistories(event)

      await expect(service.createRepairStatusHistories(event)).rejects.toThrow()
    })
  },
})
