import { createHmac } from "node:crypto"

import type {
  IAuthModuleService,
  IRbacModuleService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import { waitForPendingAuditWrites } from "../../src/api/middlewares/audit-trail"
import { configureSecurityRolesWorkflow } from "../../src/workflows/security/configure-security-roles"

const TEST_PASSWORD = "VietQR-test-password-42!"

jest.setTimeout(120_000)

function currentTotp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const normalized = secret.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = ""
  for (const character of normalized) {
    bits += alphabet.indexOf(character).toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2))
  }
  const counter = BigInt(Math.floor(Date.now() / 30_000))
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(counter)
  const digest = createHmac("sha1", Buffer.from(bytes)).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const value =
    (((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)) %
    1_000_000

  return value.toString().padStart(6, "0")
}

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
      "vietqr-integration-mfa-encryption-key-32-characters",
    VIETQR_ENABLED: "true",
    VIETQR_BANK_BIN: "970436",
    VIETQR_ACCOUNT_NUMBER: "1234567890",
    VIETQR_ACCOUNT_NAME: "DTC INTEGRATION TEST",
    VIETQR_CONFIRMATION_SECRET:
      "vietqr-integration-confirmation-secret-over-32-characters",
    VIETQR_EXPIRY_MINUTES: "30",
  },
  testSuite: ({ api, getContainer }) => {
    async function createAdmin(roleName: string, suffix: string) {
      const container = getContainer()
      const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
      const roles = await rbacService.listRbacRoles({ name: roleName })
      const email = `vietqr-${suffix}@example.test`
      const workflowService = container.resolve(Modules.WORKFLOW_ENGINE)
      const { result: users } = await workflowService.run(
        "create-users-workflow",
        { input: { users: [{ email, roles: [roles[0].id] }] } }
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

      return { token: login.data.token as string }
    }

    async function enrollAndStepUp(token: string) {
      const headers = { Authorization: `Bearer ${token}` }
      const enrollment = await api.post(
        "/auth/mfa/factors",
        { provider: "totp", label: "VietQR integration", issuer: "DTC" },
        { headers }
      )
      const secret = enrollment.data.secret as string
      const factorId = enrollment.data.mfa_factor.id as string
      await api.post(
        `/auth/mfa/factors/${factorId}/verify`,
        { code: currentTotp(secret) },
        { headers }
      )
      const challenge = await api.post(
        "/admin/security/mfa/challenges",
        {},
        { headers }
      )
      await api.post(
        `/admin/security/mfa/challenges/${challenge.data.challenge.id}/verify`,
        { method: "totp", code: currentTotp(secret) },
        { headers }
      )
    }

    beforeEach(async () => {
      await configureSecurityRolesWorkflow(getContainer()).run()
    })

    afterEach(async () => {
      await waitForPendingAuditWrites()
    })

    it("rejects unauthenticated VietQR review and refund commands", async () => {
      await expectStatus(
        api.post("/admin/orders/order_missing/vietqr/confirm", {
          idempotency_key: "vietqr-http-unauthenticated-01",
          observed_amount: "100000",
          currency_code: "vnd",
          observed_reference: "DH VQTEST",
          bank_transaction_reference: "BANK-HTTP-01",
          observed_at: new Date().toISOString(),
        }),
        401
      )
      await expectStatus(
        api.post("/admin/payments/pay_missing/vietqr/refund", {
          idempotency_key: "vietqr-http-unauthenticated-02",
          amount: "100000",
          bank_transaction_reference: "BANK-HTTP-02",
          refunded_at: new Date().toISOString(),
        }),
        401
      )
    })

    it("requires Finance permission and MFA before payment observation", async () => {
      const finance = await createAdmin("Finance", "finance-gate")
      const financeHeaders = { Authorization: `Bearer ${finance.token}` }
      const body = {
        idempotency_key: "vietqr-http-finance-confirm-01",
        observed_amount: "100000",
        currency_code: "vnd",
        observed_reference: "DH VQTEST",
        bank_transaction_reference: "BANK-HTTP-03",
        observed_at: new Date().toISOString(),
      }

      const mfaError = await expectStatus(
        api.post("/admin/orders/order_missing/vietqr/confirm", body, {
          headers: financeHeaders,
        }),
        403
      )
      expect(mfaError.message).toBe("MFA_ENROLLMENT_REQUIRED")

      await enrollAndStepUp(finance.token)
      await expectStatus(
        api.post("/admin/orders/order_missing/vietqr/confirm", body, {
          headers: financeHeaders,
        }),
        404
      )

      const support = await createAdmin("Support", "support-denied")
      await enrollAndStepUp(support.token)
      await expectStatus(
        api.post("/admin/orders/order_missing/vietqr/confirm", body, {
          headers: { Authorization: `Bearer ${support.token}` },
        }),
        403
      )
    })

    it("validates server command shape before running the workflow", async () => {
      const finance = await createAdmin("Finance", "finance-validation")
      await enrollAndStepUp(finance.token)
      const headers = { Authorization: `Bearer ${finance.token}` }

      await expectStatus(
        api.post(
          "/admin/orders/order_missing/vietqr/confirm",
          {
            idempotency_key: "short",
            observed_amount: "-1",
            currency_code: "usd",
            observed_reference: "",
            bank_transaction_reference: "x",
            observed_at: "not-a-date",
          },
          { headers }
        ),
        400
      )
    })
  },
})
