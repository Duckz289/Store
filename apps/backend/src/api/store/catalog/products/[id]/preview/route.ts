import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  getTotalVariantAvailability,
  MedusaError,
} from "@medusajs/framework/utils"

import {
  getProductPreviewSecret,
  verifyProductPreviewToken,
} from "../../../../../../utils/product-preview-token"

type PreviewVariant = {
  id: string
  manage_inventory?: boolean
  prices?: Array<{
    amount?: number | string
    currency_code?: string
    price_rules?: unknown[]
  }>
  inventory_quantity?: number
  calculated_price?: Record<string, unknown>
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = typeof req.query.token === "string" ? req.query.token : ""

  try {
    verifyProductPreviewToken({
      token,
      product_id: req.params.id,
      secret: getProductPreviewSecret(),
    })
  } catch {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Invalid or expired product preview token"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    filters: { id: req.params.id },
    fields: [
      "id",
      "title",
      "subtitle",
      "description",
      "handle",
      "status",
      "thumbnail",
      "material",
      "origin_country",
      "weight",
      "length",
      "width",
      "height",
      "metadata",
      "type.*",
      "collection.*",
      "categories.*",
      "images.*",
      "options.*",
      "options.values.*",
      "variants.*",
      "variants.options.*",
      "variants.images.*",
      "variants.prices.*",
      "variants.inventory_items.inventory.location_levels.*",
      "catalog.*",
      "catalog.brand.*",
    ],
  })
  const product = products[0]

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  const variants = (product.variants ?? []) as PreviewVariant[]
  const managedVariantIds = variants
    .filter((variant) => variant.manage_inventory)
    .map((variant) => variant.id)
  const availability = managedVariantIds.length
    ? await getTotalVariantAvailability(query, {
        variant_ids: managedVariantIds,
      })
    : {}

  for (const variant of variants) {
    if (variant.manage_inventory) {
      variant.inventory_quantity = availability[variant.id]?.availability ?? 0
    }

    const vndPrice = variant.prices?.find(
      (price) =>
        price.currency_code?.toLowerCase() === "vnd" &&
        !(price.price_rules?.length ?? 0)
    )
    if (vndPrice?.amount !== undefined) {
      const amount = Number(vndPrice.amount)
      variant.calculated_price = {
        calculated_amount: amount,
        original_amount: amount,
        currency_code: "vnd",
        calculated_price: { price_list_type: null },
      }
    }
  }

  res.setHeader("Cache-Control", "private, no-store, max-age=0")
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive")
  res.json({ product })
}
