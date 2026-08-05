import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export default async function printStorefrontKey({
  container,
}: {
  container: MedusaContainer
}) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["token", "title", "type", "revoked_at"],
    filters: {
      type: "publishable",
    },
  })

  const publishableKey = apiKeys.find(
    (apiKey) => apiKey.title === "Storefront Việt Nam" && !apiKey.revoked_at
  )

  if (!publishableKey?.token) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Không tìm thấy publishable key của Storefront Việt Nam"
    )
  }

  console.log(`STOREFRONT_PUBLISHABLE_KEY=${publishableKey.token}`)
}
