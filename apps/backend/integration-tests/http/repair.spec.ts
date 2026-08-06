import type {
  IAuthModuleService,
  IInventoryService,
  IRbacModuleService,
  IStockLocationService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"

import { configureSecurityRolesWorkflow } from "../../src/workflows/security/configure-security-roles"
import { REPAIR_MODULE } from "../../src/modules/repair"
import RepairModuleService from "../../src/modules/repair/service"
import { SECURITY_MODULE } from "../../src/modules/security"
import SecurityModuleService from "../../src/modules/security/service"
import { createRepairCaseWorkflow } from "../../src/workflows/repair/create-repair-case"
import {
  addRepairPartUsageWorkflow,
  recordRepairDiagnosisWorkflow,
  reverseRepairPartUsageWorkflow,
} from "../../src/workflows/repair/manage-repair-operations"
import {
  decideRepairQuoteWorkflow,
  saveRepairQuoteWorkflow,
  submitRepairQuoteWorkflow,
} from "../../src/workflows/repair/manage-repair-quote"
import { reconcileRepairCasesWorkflow } from "../../src/workflows/repair/reconcile-repair-cases"
import { transitionRepairCaseWorkflow } from "../../src/workflows/repair/transition-repair-case"

const TEST_PASSWORD = "Repair-test-password-42!"

jest.setTimeout(120_000)

async function expectStatus(request: Promise<unknown>, status: number) {
  try {
    await request
    throw new Error(`Expected HTTP ${status}`)
  } catch (error: any) {
    expect(error.response?.status).toBe(status)
    return error.response?.data
  }
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    MEDUSA_FF_RBAC: "true",
    AUTH_MFA_ENCRYPTION_KEY:
      "repair-integration-mfa-encryption-key-32-characters-minimum",
  },
  testSuite: ({ api, getContainer }) => {
    let publishableKey = ""

    async function createAdmin(roleName: string, suffix: string) {
      const container = getContainer()
      const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
      const roles = await rbacService.listRbacRoles({ name: roleName })
      const email = `repair-${suffix}@example.test`
      const workflowService = container.resolve(Modules.WORKFLOW_ENGINE)
      const { result: users } = await workflowService.run(
        "create-users-workflow",
        {
          input: { users: [{ email, roles: [roles[0].id] }] },
        }
      )
      const authService = container.resolve<IAuthModuleService>(Modules.AUTH)
      const registration = await authService.register("emailpass", {
        body: { email, password: TEST_PASSWORD },
      })
      if (registration.error || !registration.authIdentity) {
        throw new Error(registration.error ?? "Auth registration failed")
      }
      await authService.updateAuthIdentities({
        id: registration.authIdentity.id,
        app_metadata: { user_id: users[0].id },
      })
      const login = await api.post("/auth/user/emailpass", {
        email,
        password: TEST_PASSWORD,
      })

      return {
        headers: { Authorization: `Bearer ${login.data.token as string}` },
        userId: users[0].id as string,
      }
    }

    beforeEach(async () => {
      await configureSecurityRolesWorkflow(getContainer()).run()
      const {
        result: [key],
      } = await createApiKeysWorkflow(getContainer()).run({
        input: {
          api_keys: [
            {
              title: `Repair integration ${Date.now()}`,
              type: "publishable",
              created_by: "integration-test",
            },
          ],
        },
      })
      publishableKey = key.token
    })

    it("creates and tracks a repair case without exposing raw PII", async () => {
      const headers = { "x-publishable-api-key": publishableKey }
      const body = {
        idempotency_key: "repair-http-create-01",
        contact: {
          full_name: "HTTP Repair Customer",
          phone: "+84 909 000 000",
          email: "repair.customer@example.test",
          consented_at: new Date().toISOString(),
        },
        device: {
          device_type: "phone",
          brand: "Example",
          model: "Model 1",
          serial_number: "SERIAL-HTTP-SECRET",
          imei: "123456789012345",
          condition_summary: "Broken screen",
        },
        public_summary: "Waiting for intake",
      }

      const created = await api.post("/store/repairs", body, { headers })
      expect(created.status).toBe(201)
      expect(created.data.repair_case.status).toBe("intake")
      expect(created.data.repair_case.device.serial_number).toBe(
        "**************CRET"
      )
      expect(created.data.repair_case).not.toHaveProperty("contact")

      const replay = await api.post("/store/repairs", body, { headers })
      expect(replay.status).toBe(200)
      expect(replay.data.replayed).toBe(true)
      expect(replay.data.repair_case.id).toBe(created.data.repair_case.id)

      const tracked = await api.get(
        `/store/repairs/${created.data.repair_case.code}?phone=0909000000`,
        { headers }
      )
      expect(tracked.data.repair_case.id).toBe(created.data.repair_case.id)
      expect(tracked.data.repair_case).not.toHaveProperty("contact")

      await expectStatus(
        api.get(
          `/store/repairs/${created.data.repair_case.code}?phone=0909111111`,
          { headers }
        ),
        404
      )
    })

    it("keeps sensitive contact data outside read-only auditor access", async () => {
      const headers = { "x-publishable-api-key": publishableKey }
      const created = await api.post(
        "/store/repairs",
        {
          idempotency_key: "repair-http-create-02",
          contact: {
            full_name: "Private Repair Customer",
            phone: "0909000001",
            consented_at: new Date().toISOString(),
          },
          device: {
            device_type: "laptop",
            model: "Private Laptop",
            condition_summary: "Does not boot",
          },
        },
        { headers }
      )
      const auditor = await createAdmin(
        "Read-only Auditor",
        "auditor-contact"
      )
      const detail = await api.get(
        `/admin/repairs/${created.data.repair_case.id}`,
        { headers: auditor.headers }
      )
      expect(detail.data.repair_case).not.toHaveProperty("contact")
      await expectStatus(
        api.get(`/admin/repairs/${created.data.repair_case.id}/contact`, {
          headers: auditor.headers,
        }),
        403
      )
    })

    it("requires authentication for repair administration", async () => {
      await expectStatus(api.get("/admin/repairs"), 401)
    })

    it("enforces transitions, quote immutability, and inventory-safe parts", async () => {
      const container = getContainer()
      const technician = await createAdmin(
        "Repair Technician",
        "workflow-technician"
      )
      const { result: created } = await createRepairCaseWorkflow(container).run({
        input: {
          idempotency_key: "repair-workflow-create-01",
          actor_type: "user",
          actor_id: technician.userId,
          intake_source: "admin",
          contact: {
            full_name: "Workflow Customer",
            phone: "0909000002",
            consented_at: new Date(),
          },
          device: {
            device_type: "phone",
            model: "Workflow Model",
            condition_summary: "Battery failure",
          },
        },
      })
      const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
      await repairService.createRepairTechnicianAssignments({
        case_id: created.repair_case.id,
        technician_user_id: technician.userId,
        technician_name: "Workflow Technician",
        assigned_by: technician.userId,
        assigned_at: new Date(),
        idempotency_key: "repair-workflow-assignment-01",
      })

      let illegalTransitionError: unknown
      try {
        const illegalTransition = await transitionRepairCaseWorkflow(
          container
        ).run({
          input: {
            repair_case_id: created.repair_case.id,
            to_status: "closed",
            actor_type: "user",
            actor_id: technician.userId,
            idempotency_key: "repair-workflow-illegal-01",
          },
        })
        illegalTransitionError = illegalTransition.errors[0]?.error
      } catch (error) {
        illegalTransitionError = error
      }
      expect(illegalTransitionError).toMatchObject({
        message: "REPAIR_TRANSITION_ROLE_NOT_ALLOWED",
      })

      const transitionInput = {
        repair_case_id: created.repair_case.id,
        to_status: "diagnosis" as const,
        actor_type: "user" as const,
        actor_id: technician.userId,
        idempotency_key: "repair-workflow-transition-01",
        expected_revision: 1,
      }
      const firstTransition = await transitionRepairCaseWorkflow(container).run({
        input: transitionInput,
      })
      const replayedTransition = await transitionRepairCaseWorkflow(
        container
      ).run({ input: transitionInput })
      expect(firstTransition.result.repair_case.status).toBe("diagnosis")
      expect(replayedTransition.result.replayed).toBe(true)
      expect(
        await repairService.listRepairStatusHistories({
          case_id: created.repair_case.id,
          to_status: "diagnosis",
        })
      ).toHaveLength(1)

      await recordRepairDiagnosisWorkflow(container).run({
        input: {
          repair_case_id: created.repair_case.id,
          actor_id: technician.userId,
          idempotency_key: "repair-workflow-diagnosis-01",
          severity: "high",
          findings: "Battery no longer holds a charge",
          recommended_action: "Replace the battery",
        },
      })
      await transitionRepairCaseWorkflow(container).run({
        input: {
          repair_case_id: created.repair_case.id,
          to_status: "quote",
          actor_type: "user",
          actor_id: technician.userId,
          idempotency_key: "repair-workflow-transition-02",
          expected_revision: 2,
        },
      })
      const saved = await saveRepairQuoteWorkflow(container).run({
        input: {
          repair_case_id: created.repair_case.id,
          actor_id: technician.userId,
          actor_type: "user",
          idempotency_key: "repair-workflow-quote-01",
          currency_code: "vnd",
          diagnosis_version: 1,
          items: [
            {
              kind: "part",
              title: "Battery",
              sku: "BAT-WORKFLOW",
              quantity: 1,
              unit_price: 500_000,
            },
          ],
        },
      })
      const submitted = await submitRepairQuoteWorkflow(container).run({
        input: {
          repair_case_id: created.repair_case.id,
          quote_id: saved.result.quote.id,
          actor_id: technician.userId,
          actor_type: "user",
          idempotency_key: "repair-workflow-submit-01",
        },
      })
      let immutableQuoteError: unknown
      try {
        const immutableQuoteEdit = await saveRepairQuoteWorkflow(container).run({
          input: {
            repair_case_id: created.repair_case.id,
            quote_id: saved.result.quote.id,
            actor_id: technician.userId,
            actor_type: "user",
            idempotency_key: "repair-workflow-quote-edit-01",
            currency_code: "vnd",
            diagnosis_version: 1,
            items: [
              {
                kind: "part",
                title: "Tampered battery",
                quantity: 1,
                unit_price: 1,
              },
            ],
          },
        })
        immutableQuoteError = immutableQuoteEdit.errors[0]?.error
      } catch (error) {
        immutableQuoteError = error
      }
      expect(immutableQuoteError).toMatchObject({
        message: "REPAIR_QUOTE_REQUIRES_QUOTE_STATUS",
      })

      const decisionInput = {
        repair_code: created.repair_case.code,
        decision_token: submitted.result.decision_token!,
        decision: "approved" as const,
        idempotency_key: "repair-workflow-decision-01",
      }
      await decideRepairQuoteWorkflow(container).run({ input: decisionInput })
      const decisionReplay = await decideRepairQuoteWorkflow(container).run({
        input: decisionInput,
      })
      expect(decisionReplay.result.replayed).toBe(true)

      const stockLocationService = container.resolve<IStockLocationService>(
        Modules.STOCK_LOCATION
      )
      const inventoryService = container.resolve<IInventoryService>(
        Modules.INVENTORY
      )
      const location = await stockLocationService.createStockLocations({
        name: "Repair Workflow Location",
      })
      const inventoryItem = await inventoryService.createInventoryItems({
        sku: "BAT-WORKFLOW",
        title: "Workflow Battery",
      })
      await inventoryService.createInventoryLevels({
        inventory_item_id: inventoryItem.id,
        location_id: location.id,
        stocked_quantity: 10,
      })
      const partInput = {
        repair_case_id: created.repair_case.id,
        inventory_item_id: inventoryItem.id,
        location_id: location.id,
        sku: inventoryItem.sku,
        title: inventoryItem.title!,
        quantity: 2,
        actor_id: technician.userId,
        idempotency_key: "repair-workflow-part-01",
      }
      const part = await addRepairPartUsageWorkflow(container).run({
        input: partInput,
      })
      const partReplay = await addRepairPartUsageWorkflow(container).run({
        input: partInput,
      })
      expect(partReplay.result.replayed).toBe(true)
      expect(
        Number(
          await inventoryService.retrieveStockedQuantity(inventoryItem.id, [
            location.id,
          ])
        )
      ).toBe(8)

      const reversalInput = {
        repair_case_id: created.repair_case.id,
        part_usage_id: part.result.part_usage.id,
        actor_id: technician.userId,
        idempotency_key: "repair-workflow-part-reverse-01",
      }
      await reverseRepairPartUsageWorkflow(container).run({
        input: reversalInput,
      })
      const reversalReplay = await reverseRepairPartUsageWorkflow(container).run({
        input: reversalInput,
      })
      expect(reversalReplay.result.replayed).toBe(true)
      expect(
        Number(
          await inventoryService.retrieveStockedQuantity(inventoryItem.id, [
            location.id,
          ])
        )
      ).toBe(10)

      const securityService = container.resolve<SecurityModuleService>(
        SECURITY_MODULE
      )
      const auditEvents = await securityService.listAuditEvents({
        correlation_id: `repair:${created.repair_case.id}`,
      })
      expect(auditEvents.map((event) => event.action)).toEqual(
        expect.arrayContaining([
          "repair.quote.approved",
          "repair.part.applied",
          "repair.part.reversed",
        ])
      )
    })

    it("reconciles deterministically without silently repairing state", async () => {
      const container = getContainer()
      const repairService = container.resolve<RepairModuleService>(REPAIR_MODULE)
      const repairCase = await repairService.createRepairCases({
        code: "SC-RECONCILE01",
        status: "diagnosis",
        revision: 2,
        intake_source: "admin",
      })
      await repairService.createRepairStatusHistories({
        case_id: repairCase.id,
        from_status: null,
        to_status: "intake",
        actor_type: "system",
        actor_id: "integration-test",
        idempotency_key: "repair-reconcile-history-01",
        sequence: 1,
        occurred_at: new Date(),
      })

      await reconcileRepairCasesWorkflow(container).run()
      await reconcileRepairCasesWorkflow(container).run()

      const issues = await repairService.listRepairReconciliationIssues({
        repair_case_id: repairCase.id,
        issue_type: "status_history_mismatch",
      })
      const unchanged = await repairService.retrieveRepairCase(repairCase.id)
      expect(issues).toHaveLength(1)
      expect(issues[0].status).toBe("open")
      expect(unchanged.status).toBe("diagnosis")
    })
  },
})
