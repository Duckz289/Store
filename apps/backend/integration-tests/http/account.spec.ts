import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

const TEST_PASSWORD = "Customer-test-password-42!"

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
  testSuite: ({ api, getContainer }) => {
    let publishableKey = ""

    const headersFor = (token?: string) => ({
      "x-publishable-api-key": publishableKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    })

    async function createCustomer(suffix: string) {
      const email = `customer-${suffix}@example.test`
      const registration = await api.post(
        "/auth/customer/emailpass/register",
        { email, password: TEST_PASSWORD }
      )
      const registrationToken = registration.data.token as string

      const created = await api.post(
        "/store/customers",
        {
          email,
          first_name: "Customer",
          last_name: suffix,
        },
        { headers: headersFor(registrationToken) }
      )
      const login = await api.post("/auth/customer/emailpass", {
        email,
        password: TEST_PASSWORD,
      })

      return {
        id: created.data.customer.id as string,
        email,
        headers: headersFor(login.data.token as string),
      }
    }

    beforeEach(async () => {
      const {
        result: [key],
      } = await createApiKeysWorkflow(getContainer()).run({
        input: {
          api_keys: [
            {
              title: `Account integration ${Date.now()}`,
              type: "publishable",
              created_by: "integration-test",
            },
          ],
        },
      })
      publishableKey = key.token
    })

    it("keeps profile and address data scoped to the authenticated customer", async () => {
      const customerA = await createCustomer("a")
      const customerB = await createCustomer("b")

      const profile = await api.get("/store/customers/me", {
        headers: customerB.headers,
      })
      expect(profile.data.customer.id).toBe(customerB.id)
      expect(profile.data.customer.email).toBe(customerB.email)
      expect(profile.data.customer.id).not.toBe(customerA.id)

      const address = await api.post(
        "/store/customers/me/addresses",
        {
          first_name: "Customer",
          last_name: "A",
          address_1: "1 Example Street",
          city: "Ho Chi Minh City",
          province: "Ho Chi Minh City",
          country_code: "vn",
          is_default_shipping: true,
        },
        { headers: customerA.headers }
      )
      const addressId = address.data.customer.addresses[0].id as string

      await expectStatus(
        api.get(`/store/customers/me/addresses/${addressId}`, {
          headers: customerB.headers,
        }),
        404
      )
      await expectStatus(
        api.delete(`/store/customers/me/addresses/${addressId}`, {
          headers: customerB.headers,
        }),
        404
      )
    })

    it("requires a customer session before reading an order detail", async () => {
      await expectStatus(
        api.get("/store/orders/order_account_access_check", {
          headers: headersFor(),
        }),
        401
      )
    })
  },
})
