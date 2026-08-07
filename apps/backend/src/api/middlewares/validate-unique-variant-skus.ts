import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

type VariantInput = {
  id?: string
  sku?: string | null
}

type VariantRecord = {
  id: string
  sku?: string | null
}

function getVariantInputs(body: unknown): VariantInput[] {
  if (!body || typeof body !== "object") {
    return []
  }

  const input = body as { variants?: unknown; id?: unknown; sku?: unknown }

  if (Array.isArray(input.variants)) {
    return input.variants.filter(
      (variant): variant is VariantInput =>
        Boolean(variant) && typeof variant === "object"
    )
  }

  if (typeof input.sku === "string") {
    return [
      {
        id: typeof input.id === "string" ? input.id : undefined,
        sku: input.sku,
      },
    ]
  }

  return []
}

export async function validateUniqueVariantSkus(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const variants = getVariantInputs(req.body)
    const normalized = variants
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku?.trim(),
      }))
      .filter(
        (variant): variant is { id: string | undefined; sku: string } =>
          Boolean(variant.sku)
      )

    if (!normalized.length) {
      return next()
    }

    const incomingCounts = new Map<string, number>()
    for (const variant of normalized) {
      incomingCounts.set(
        variant.sku,
        (incomingCounts.get(variant.sku) ?? 0) + 1
      )
    }

    const duplicatedInRequest = [...incomingCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([sku]) => sku)

    if (duplicatedInRequest.length) {
      return next(duplicateSkuError(duplicatedInRequest))
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product_variant",
      filters: { sku: normalized.map((variant) => variant.sku) },
      fields: ["id", "sku"],
    })
    const submittedIds = new Set(
      normalized
        .map((variant) => variant.id)
        .filter((id): id is string => Boolean(id))
    )
    const routeVariantId = req.params.variant_id
    if (routeVariantId) {
      submittedIds.add(routeVariantId)
    }

    const conflictingSkus = (data as VariantRecord[])
      .filter((variant) => !submittedIds.has(variant.id))
      .map((variant) => variant.sku?.trim())
      .filter((sku): sku is string => Boolean(sku))

    if (conflictingSkus.length) {
      return next(duplicateSkuError(conflictingSkus))
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

function duplicateSkuError(skus: string[]) {
  return new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Each sellable variant must have a unique SKU. Duplicate SKU: ${[
      ...new Set(skus),
    ]
      .sort()
      .join(", ")}`
  )
}
