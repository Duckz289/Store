import { moduleIntegrationTestRunner } from "@medusajs/test-utils"

import { prepareAuditEvent, verifyAuditEventIntegrity } from "../../../utils/security-audit"
import { SECURITY_MODULE } from ".."
import SecurityModuleService from "../service"

moduleIntegrationTestRunner<SecurityModuleService>({
  moduleName: SECURITY_MODULE,
  resolve: "./src/modules/security",
  testSuite: ({ service }) => {
    it("persists append-only audit evidence with a verifiable hash", async () => {
      const event = await service.createAuditEvents(
        prepareAuditEvent({
          correlation_id: "module-integration-audit",
          actor_id: "user_test",
          actor_type: "user",
          action: "order.update",
          resource_type: "order",
          resource_id: "order_test",
          outcome: "success",
          after: { token: "must-not-persist", status: "completed" },
        })
      )

      expect(event.after).toEqual({
        token: "<redacted:secret>",
        status: "completed",
      })
      expect(verifyAuditEventIntegrity(event)).toBe(true)
      expect(
        verifyAuditEventIntegrity({ ...event, outcome: "denied" })
      ).toBe(false)
    })

    it("stores and revokes an MFA assurance", async () => {
      const assurance = await service.createMfaAssurances({
        auth_identity_id: "auth_test",
        actor_id: "user_test",
        credential_hash: "hash_test",
        verification_method: "totp",
        verified_at: new Date(),
        expires_at: new Date(Date.now() + 600_000),
        revoked_at: null,
      })

      const revoked = await service.updateMfaAssurances({
        id: assurance.id,
        revoked_at: new Date(),
      })
      expect(revoked.revoked_at).toBeTruthy()
    })
  },
})
