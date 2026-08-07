import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

const TEST_PASSWORD = "Customer-test-password-42!"

jest.setTimeout(120_000)

medusaIntegrationTestRunner({
  inApp: true,
  testSuite: ({ api, getContainer }) => {
    let publishableKey = ""

    beforeEach(async () => {
      const {
        result: [key],
      } = await createApiKeysWorkflow(getContainer()).run({
        input: {
          api_keys: [
            {
              title: `Notification integration ${Date.now()}`,
              type: "publishable",
              created_by: "integration-test",
            },
          ],
        },
      })
      publishableKey = key.token
    })

    it("keeps password reset requests non-enumerating", async () => {
      const email = `notification-${Date.now()}@example.test`
      const registration = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: TEST_PASSWORD }
      )
      await api.post(
        "/store/customers",
        { email, first_name: "Notification", last_name: "Test" },
        {
          headers: {
            "x-publishable-api-key": publishableKey,
            Authorization: `Bearer ${registration.data.token}`,
          },
        }
      )

      const headers = { "x-publishable-api-key": publishableKey }
      const known = await api.post(
        "/auth/customer/emailpass/reset-password",
        { identifier: email },
        { headers }
      )
      const unknown = await api.post(
        "/auth/customer/emailpass/reset-password",
        { identifier: `unknown-${email}` },
        { headers }
      )

      expect(known.status).toBe(201)
      expect(unknown.status).toBe(201)
      expect(known.data).toEqual(unknown.data)
    })
  },
})
