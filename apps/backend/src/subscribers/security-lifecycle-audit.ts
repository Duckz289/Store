import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  FulfillmentWorkflowEvents,
  InventoryItemWorkflowEvents,
  InventoryLevelWorkflowEvents,
  OrderWorkflowEvents,
  PaymentEvents,
  ProductWorkflowEvents,
} from "@medusajs/framework/utils"

import { SECURITY_MODULE } from "../modules/security"
import SecurityModuleService from "../modules/security/service"
import { prepareAuditEvent } from "../utils/security-audit"

type LifecycleEventData = Record<string, unknown> & {
  id?: string
  order_id?: string
}

function resourceTypeForEvent(eventName: string) {
  if (eventName.startsWith("order.")) {
    return "order"
  }
  if (eventName.startsWith("payment.")) {
    return "payment"
  }
  if (
    eventName.startsWith("shipment.") ||
    eventName.startsWith("delivery.")
  ) {
    return "fulfillment"
  }
  if (eventName.startsWith("product.")) {
    return "product"
  }
  if (eventName.startsWith("inventory-level.")) {
    return "inventory_level"
  }

  return "inventory_item"
}

export default async function securityLifecycleAuditHandler({
  event,
  container,
}: SubscriberArgs<LifecycleEventData>) {
  const securityService = container.resolve<SecurityModuleService>(
    SECURITY_MODULE
  )
  const resourceType = resourceTypeForEvent(event.name)
  const resourceId = event.data.order_id ?? event.data.id ?? null
  const occurredAt =
    event.metadata?.published_at ?? event.metadata?.created_at ?? new Date()

  await securityService.createAuditEvents(
    prepareAuditEvent({
      correlation_id: `lifecycle:${resourceType}:${resourceId ?? "unknown"}`,
      actor_id: "system",
      actor_type: "system",
      action: event.name,
      resource_type: resourceType,
      resource_id: resourceId,
      outcome: "success",
      after: event.data,
      metadata: {
        event_group_id: event.metadata?.eventGroupId,
      },
      occurred_at: occurredAt,
    })
  )
}

export const config: SubscriberConfig = {
  event: [
    OrderWorkflowEvents.PLACED,
    OrderWorkflowEvents.UPDATED,
    OrderWorkflowEvents.CANCELED,
    OrderWorkflowEvents.COMPLETED,
    OrderWorkflowEvents.ARCHIVED,
    OrderWorkflowEvents.FULFILLMENT_CREATED,
    OrderWorkflowEvents.FULFILLMENT_CANCELED,
    OrderWorkflowEvents.RETURN_REQUESTED,
    OrderWorkflowEvents.RETURN_RECEIVED,
    PaymentEvents.CAPTURED,
    PaymentEvents.REFUNDED,
    FulfillmentWorkflowEvents.SHIPMENT_CREATED,
    FulfillmentWorkflowEvents.DELIVERY_CREATED,
    ProductWorkflowEvents.CREATED,
    ProductWorkflowEvents.UPDATED,
    ProductWorkflowEvents.DELETED,
    InventoryItemWorkflowEvents.CREATED,
    InventoryItemWorkflowEvents.UPDATED,
    InventoryItemWorkflowEvents.DELETED,
    InventoryLevelWorkflowEvents.CREATED,
    InventoryLevelWorkflowEvents.UPDATED,
    InventoryLevelWorkflowEvents.DELETED,
  ],
  context: {
    subscriberId: "security-lifecycle-audit",
  },
}
