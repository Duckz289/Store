import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getOrderDetailWorkflow } from "@medusajs/medusa/core-flows"

const CUSTOMER_ORDER_FIELDS = [
  "id",
  "display_id",
  "email",
  "created_at",
  "currency_code",
  "status",
  "payment_status",
  "fulfillment_status",
  "subtotal",
  "discount_total",
  "gift_card_total",
  "shipping_total",
  "tax_total",
  "total",
  "items.*",
  "items.metadata",
  "items.variant.*",
  "items.product.*",
  "shipping_address.*",
  "billing_address.*",
  "shipping_methods.*",
  "payment_collections.*",
  "payment_collections.payments.*",
  "payment_collections.payment_sessions.*",
  "fulfillments.*",
]

/**
 * Store API override for the native order-detail route.
 *
 * Medusa 2.18's list endpoint applies `auth_context.actor_id`, whereas the
 * native detail route does not. This official route override keeps the core
 * workflow but constrains it to the authenticated customer before any order
 * fields are read.
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await getOrderDetailWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      fields: CUSTOMER_ORDER_FIELDS,
      filters: {
        is_draft_order: false,
        customer_id: req.auth_context.actor_id,
      },
    },
  })

  return res.status(200).json({ order: result })
}
