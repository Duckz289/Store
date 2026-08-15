import { createHmac } from "node:crypto"

import type {
  IAuthModuleService,
  IRbacModuleService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

import { SECURITY_MODULE } from "../../src/modules/security"
import SecurityModuleService from "../../src/modules/security/service"
import { waitForPendingAuditWrites } from "../../src/api/middlewares/audit-trail"
import { configureSecurityRolesWorkflow } from "../../src/workflows/security/configure-security-roles"

const TEST_PASSWORD = "Test-password-42!"

jest.setTimeout(120_000)

function decodeBase32(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const normalized = value.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = ""

  for (const character of normalized) {
    bits += alphabet.indexOf(character).toString(2).padStart(5, "0")
  }

  const bytes: number[] = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2))
  }

  return Buffer.from(bytes)
}

function currentTotp(secret: string, at = Date.now()): string {
  const counter = BigInt(Math.floor(at / 30_000))
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(counter)
  const digest = createHmac("sha1", decodeBase32(secret))
    .update(buffer)
    .digest()
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
    MFA_STEP_UP_TTL_SECONDS: "600",
    AUTH_MFA_ENCRYPTION_KEY:
      "integration-test-mfa-encryption-key-32-characters-minimum",
  },
  testSuite: ({ api, getContainer }) => {
    async function createAdmin(roleName: string, suffix: string) {
      const container = getContainer()
      const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
      const roles = await rbacService.listRbacRoles({ name: roleName })
      const email = `security-${suffix}@example.test`
      const workflowService = container.resolve(Modules.WORKFLOW_ENGINE)
      const { result: users } = await workflowService.run(
        "create-users-workflow",
        {
          input: {
            users: [{ email, roles: [roles[0].id] }],
          },
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
        authIdentityId: registration.authIdentity.id,
        email,
        token: login.data.token as string,
        userId: users[0].id,
      }
    }

    async function enrollTotp(token: string) {
      const headers = { Authorization: `Bearer ${token}` }
      const enrollment = await api.post(
        "/auth/mfa/factors",
        { provider: "totp", label: "Security integration", issuer: "DTC" },
        { headers }
      )
      const secret = enrollment.data.secret as string
      const factorId = enrollment.data.mfa_factor.id as string
      await api.post(
        `/auth/mfa/factors/${factorId}/verify`,
        { code: currentTotp(secret) },
        { headers }
      )

      return secret
    }

    async function stepUpAdmin(token: string) {
      const headers = { Authorization: `Bearer ${token}` }
      const secret = await enrollTotp(token)
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

      return headers
    }

    beforeEach(async () => {
      await configureSecurityRolesWorkflow(getContainer()).run()
    })

    afterEach(async () => {
      await waitForPendingAuditWrites()
    })

    it("rejects unauthenticated security endpoints", async () => {
      await expectStatus(
        api.post("/admin/security/mfa/challenges", {}),
        401
      )
      await expectStatus(api.get("/admin/security/audit-events"), 401)
    })

    it("prevents role escalation and enforces MFA on Owner mutations", async () => {
      const owner = await createAdmin("Owner", "owner-gate")
      const ownerHeaders = { Authorization: `Bearer ${owner.token}` }
      const me = await api.get("/admin/users/me", { headers: ownerHeaders })

      expect(me.data.user.id).toBe(owner.userId)
      const mfaError = await expectStatus(
        api.post(
          `/admin/users/${owner.userId}`,
          { first_name: "Blocked" },
          { headers: ownerHeaders }
        ),
        403
      )
      expect(mfaError.message).toBe("MFA_ENROLLMENT_REQUIRED")

      const auditor = await createAdmin("Read-only Auditor", "auditor")
      const auditorHeaders = { Authorization: `Bearer ${auditor.token}` }
      await api.get("/admin/products", { headers: auditorHeaders })
      await expectStatus(
        api.post(
          "/admin/rbac/roles",
          { name: "Escalated role" },
          { headers: auditorHeaders }
        ),
        403
      )

      const rbacService = getContainer().resolve<IRbacModuleService>(
        Modules.RBAC
      )
      expect(
        await rbacService.listRbacRoles({ name: "Escalated role" })
      ).toHaveLength(0)
    })

    it("reserves system health and staff controls for the System Owner", async () => {
      const systemOwner = await createAdmin("System Owner", "system-owner")
      const businessOwner = await createAdmin("Owner", "business-owner")
      const systemOwnerHeaders = await stepUpAdmin(systemOwner.token)
      const businessOwnerHeaders = await stepUpAdmin(businessOwner.token)

      const identity = await api.get("/admin/system/me", {
        headers: systemOwnerHeaders,
      })
      expect(identity.data.access).toMatchObject({
        is_system_owner: true,
        can_manage_system: true,
      })

      const denied = await expectStatus(
        api.get("/admin/system/health", { headers: businessOwnerHeaders }),
        403
      )
      expect(denied.message).toBe("SYSTEM_OWNER_REQUIRED")

      const health = await api.get("/admin/system/health", {
        headers: systemOwnerHeaders,
      })
      expect(health.data.checks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "database" }),
          expect.objectContaining({ id: "system_owner" }),
          expect.objectContaining({ id: "audit" }),
        ])
      )
      expect(Array.isArray(health.data.traces)).toBe(true)

      const staff = await api.get("/admin/system/staff", {
        headers: systemOwnerHeaders,
      })
      expect(staff.data.system_owner_count).toBe(1)
      expect(staff.data.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: systemOwner.userId, is_system_owner: true }),
        ])
      )
    })

    it("rejects a challenge verified by a different auth identity", async () => {
      const owner = await createAdmin("Owner", "challenge-owner")
      const attacker = await createAdmin("Owner", "challenge-attacker")
      const ownerHeaders = { Authorization: `Bearer ${owner.token}` }
      const attackerHeaders = { Authorization: `Bearer ${attacker.token}` }
      const secret = await enrollTotp(owner.token)
      const challenge = await api.post(
        "/admin/security/mfa/challenges",
        {},
        { headers: ownerHeaders }
      )

      const response = await expectStatus(
        api.post(
          `/admin/security/mfa/challenges/${challenge.data.challenge.id}/verify`,
          { method: "totp", code: currentTotp(secret) },
          { headers: attackerHeaders }
        ),
        403
      )
      expect(response.message).toBe("MFA_CHALLENGE_IDENTITY_MISMATCH")

      const securityService = getContainer().resolve<SecurityModuleService>(
        SECURITY_MODULE
      )
      expect(
        await securityService.listMfaAssurances({
          auth_identity_id: attacker.authIdentityId,
        })
      ).toHaveLength(0)
    })

    it("traces an order lifecycle under one correlation ID", async () => {
      const eventBus = getContainer().resolve(Modules.EVENT_BUS)
      const orderId = "order_security_trace"

      await eventBus.emit([
        { name: "order.placed", data: { id: orderId } },
        { name: "order.updated", data: { id: orderId } },
        { name: "order.completed", data: { id: orderId } },
      ])

      const securityService = getContainer().resolve<SecurityModuleService>(
        SECURITY_MODULE
      )
      let events = await securityService.listAuditEvents(
        { correlation_id: `lifecycle:order:${orderId}` },
        { order: { occurred_at: "ASC" } }
      )
      for (let attempt = 0; attempt < 20 && events.length < 3; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        events = await securityService.listAuditEvents(
          { correlation_id: `lifecycle:order:${orderId}` },
          { order: { occurred_at: "ASC" } }
        )
      }

      expect(events.map((event) => event.action)).toEqual([
        "order.placed",
        "order.updated",
        "order.completed",
      ])
      expect(events.every((event) => event.resource_id === orderId)).toBe(true)
    })

    it("steps up a System Owner session, audits a mutation, and revokes assurance on logout", async () => {
      const owner = await createAdmin("System Owner", "session-owner")
      const bearerHeaders = { Authorization: `Bearer ${owner.token}` }
      const secret = await enrollTotp(owner.token)
      const recovery = await api.post(
        "/auth/mfa/recovery-codes",
        { count: 1 },
        { headers: bearerHeaders }
      )
      const recoveryCode = recovery.data.recovery_codes[0] as string
      const session = await api.post("/auth/session", {}, { headers: bearerHeaders })
      const cookie = session.headers["set-cookie"]?.[0]?.split(";", 1)[0]

      expect(cookie).toBeTruthy()
      const sessionHeaders = { Cookie: cookie }
      const challenge = await api.post(
        "/admin/security/mfa/challenges",
        {},
        { headers: sessionHeaders }
      )

      await expectStatus(
        api.post(
          `/admin/security/mfa/challenges/${challenge.data.challenge.id}/verify`,
          { method: "totp", code: "000000" },
          { headers: sessionHeaders }
        ),
        400
      )

      const retryChallenge = await api.post(
        "/admin/security/mfa/challenges",
        {},
        { headers: sessionHeaders }
      )
      await api.post(
        `/admin/security/mfa/challenges/${retryChallenge.data.challenge.id}/verify`,
        { method: "totp", code: currentTotp(secret) },
        { headers: sessionHeaders }
      )

      const correlationId = "integration-security-user-update"
      await api.post(
        `/admin/users/${owner.userId}`,
        { first_name: "Audited" },
        { headers: { ...sessionHeaders, "x-request-id": correlationId } }
      )

      let auditEvent: any
      for (let attempt = 0; attempt < 20 && !auditEvent; attempt++) {
        const audit = await api.get(
          `/admin/security/audit-events?correlation_id=${correlationId}`,
          { headers: sessionHeaders }
        )
        auditEvent = audit.data.audit_events[0]
        if (!auditEvent) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      expect(auditEvent).toMatchObject({
        actor_id: owner.userId,
        action: "user.update",
        resource_type: "user",
        resource_id: owner.userId,
        outcome: "success",
        integrity_valid: true,
      })
      expect(JSON.stringify(auditEvent)).not.toContain(owner.token)

      const recoveryChallenge = await api.post(
        "/admin/security/mfa/challenges",
        {},
        { headers: sessionHeaders }
      )
      await api.post(
        `/admin/security/mfa/challenges/${recoveryChallenge.data.challenge.id}/verify`,
        { method: "recovery_code", code: recoveryCode },
        { headers: sessionHeaders }
      )

      await api.delete("/auth/session", { headers: sessionHeaders })
      await expectStatus(
        api.get("/admin/security/audit-events", { headers: sessionHeaders }),
        401
      )

      const securityService = getContainer().resolve<SecurityModuleService>(
        SECURITY_MODULE
      )
      const assurances = await securityService.listMfaAssurances({
        auth_identity_id: owner.authIdentityId,
      })
      expect(assurances).toHaveLength(2)
      expect(assurances.every((assurance) => assurance.revoked_at)).toBe(true)
    })
  },
})
