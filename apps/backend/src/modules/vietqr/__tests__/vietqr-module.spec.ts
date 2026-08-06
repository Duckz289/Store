import { moduleIntegrationTestRunner } from "@medusajs/test-utils"

import { VIETQR_MODULE } from ".."
import VietQrModuleService from "../service"

moduleIntegrationTestRunner<VietQrModuleService>({
  moduleName: VIETQR_MODULE,
  resolve: "./src/modules/vietqr",
  testSuite: ({ service }) => {
    it("persists append-only transfer observations", async () => {
      const observation = await service.createVietQrTransferObservations({
        payment_session_id: "payses_module_01",
        order_id: "order_module_01",
        provider_reference: "VQMODULE01",
        expected_amount: 500_000,
        observed_amount: 500_000,
        currency_code: "vnd",
        observed_reference: "DH VQMODULE01",
        outcome: "exact",
        bank_transaction_reference: "BANK-MODULE-01",
        bank_transaction_hash: "hash-module-01",
        actor_id: "user_finance",
        observed_at: new Date(),
      })

      const persisted = await service.retrieveVietQrTransferObservation(
        observation.id
      )
      expect(persisted.outcome).toBe("exact")
      expect(persisted.expected_amount).toBe(500_000)
    })

    it("rejects duplicate bank transaction references", async () => {
      const input = {
        payment_session_id: "payses_module_02",
        order_id: "order_module_02",
        provider_reference: "VQMODULE02",
        expected_amount: 100_000,
        observed_amount: 90_000,
        currency_code: "vnd",
        observed_reference: "DH VQMODULE02",
        outcome: "underpaid" as const,
        bank_transaction_reference: "BANK-MODULE-02",
        bank_transaction_hash: "hash-module-02",
        actor_id: "user_finance",
        observed_at: new Date(),
      }
      await service.createVietQrTransferObservations(input)

      await expect(
        service.createVietQrTransferObservations({
          ...input,
          payment_session_id: "payses_module_other",
          order_id: "order_module_other",
        })
      ).rejects.toThrow()
    })

    it("enforces operation-scoped idempotency receipts and issue fingerprints", async () => {
      const receipt = {
        operation: "confirm" as const,
        idempotency_key: "vietqr-module-command-01",
        request_hash: "request-hash-01",
        result_type: "vietqr_transfer_observation",
        result_id: "vqrobs_module",
        actor_id: "user_finance",
        completed_at: new Date(),
      }
      await service.createVietQrCommandReceipts(receipt)
      await expect(service.createVietQrCommandReceipts(receipt)).rejects.toThrow()

      const issue = {
        payment_session_id: "payses_module_03",
        order_id: "order_module_03",
        fingerprint: "fingerprint-module-03",
        issue_type: "expired_pending" as const,
        status: "open" as const,
        detected_at: new Date(),
      }
      await service.createVietQrReconciliationIssues(issue)
      await expect(
        service.createVietQrReconciliationIssues(issue)
      ).rejects.toThrow()
    })

    it("links a real manual refund receipt to one Medusa refund", async () => {
      const refund = await service.createVietQrManualRefunds({
        payment_id: "pay_module_01",
        order_id: "order_module_04",
        amount: 250_000,
        currency_code: "vnd",
        bank_transaction_reference: "BANK-REFUND-01",
        bank_transaction_hash: "hash-refund-01",
        actor_id: "user_finance",
        refunded_at: new Date(),
      })
      const updated = await service.updateVietQrManualRefunds({
        id: refund.id,
        medusa_refund_id: "refund_core_01",
      })

      expect(updated.medusa_refund_id).toBe("refund_core_01")
    })
  },
})
