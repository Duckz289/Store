import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  getProductPreviewSecret,
  issueProductPreviewToken,
  PRODUCT_PREVIEW_TTL_SECONDS,
} from "../../../../../utils/product-preview-token"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { id: req.params.id },
  })

  if (!products[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  const actorId = (
    req as MedusaRequest & { auth_context: { actor_id: string } }
  ).auth_context.actor_id
  const token = issueProductPreviewToken({
    product_id: req.params.id,
    actor_id: actorId,
    secret: getProductPreviewSecret(),
  })
  const storefrontUrl = (process.env.STOREFRONT_URL ?? "http://localhost:8010")
    .replace(/\/$/, "")
  const countryCode = (
    process.env.STOREFRONT_DEFAULT_COUNTRY ?? "vn"
  )
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "") || "vn"

  res.json({
    token,
    expires_in: PRODUCT_PREVIEW_TTL_SECONDS,
    url: `${storefrontUrl}/${countryCode}/preview/products/${req.params.id}?token=${encodeURIComponent(
      token
    )}`,
  })
}
