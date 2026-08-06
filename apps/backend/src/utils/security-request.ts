import { randomUUID } from "node:crypto"

import type { MedusaRequest } from "@medusajs/framework/http"

const SAFE_CORRELATION_ID = /^[A-Za-z0-9._:-]{1,128}$/

const RESOURCE_SEGMENT_ALIASES: Record<string, string> = {
  "api-keys": "api_key",
  "inventory-items": "inventory_item",
  "payment-collections": "payment_collection",
  "price-lists": "price_list",
  "price-preferences": "price_preference",
  "product-categories": "product_category",
  "product-tags": "product_tag",
  "product-types": "product_type",
  "refund-reasons": "refund_reason",
  "return-reasons": "return_reason",
  "sales-channels": "sales_channel",
  "shipping-options": "shipping_option",
  "shipping-profiles": "shipping_profile",
  "stock-locations": "stock_location",
}

export function getCorrelationId(req: MedusaRequest): string {
  const candidate = req.headers["x-request-id"]
  const value = Array.isArray(candidate) ? candidate[0] : candidate

  return value && SAFE_CORRELATION_ID.test(value) ? value : randomUUID()
}

export function classifySecurityRequest(method: string, path: string) {
  const segments = path.split("?")[0].split("/").filter(Boolean)
  const root = segments[0] ?? "unknown"
  const resourceSegment = segments[1] ?? root
  const resourceType =
    RESOURCE_SEGMENT_ALIASES[resourceSegment] ??
    resourceSegment.replace(/-/g, "_").replace(/s$/, "")
  const resourceId = segments.find((segment, index) => {
    if (index < 2) {
      return false
    }

    return /^(?:[a-z]+_)?[A-Za-z0-9]{6,}$/.test(segment)
  })
  const operation =
    method === "POST"
      ? resourceId
        ? "update"
        : "create"
      : method === "DELETE"
        ? "delete"
        : method === "GET"
          ? "read"
          : "update"

  return {
    action: `${resourceType}.${operation}`,
    resource_type: resourceType,
    resource_id: resourceId ?? null,
  }
}
