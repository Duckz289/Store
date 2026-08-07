import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { buildCustomerPasswordResetUrl, hashRecoveryIdentifier } from "../utils/account-recovery"
import { appendAuditEventWorkflow } from "../workflows/security/append-audit-event"

type PasswordResetEvent = {
  actor_type: string
  entity_id: string
  token: string
}

export default async function customerPasswordResetHandler({
  event,
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  if (event.data.actor_type !== "customer") {
    return
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const origin = process.env.STOREFRONT_URL ?? ""
  const countryCode = process.env.STOREFRONT_DEFAULT_COUNTRY ?? ""

  if (!origin || !countryCode) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Customer password reset origin is not configured"
    )
  }

  const resetUrl = buildCustomerPasswordResetUrl(
    origin,
    countryCode,
    event.data.entity_id,
    event.data.token
  )
  const correlationId = `auth.customer.password_reset.notification:${hashRecoveryIdentifier(event.data.entity_id)}`

  try {
    await notificationModuleService.createNotifications({
      to: event.data.entity_id,
      channel: "email",
      template: "password-reset",
      trigger_type: "auth.password_reset",
      data: {
        reset_url: resetUrl,
        expires_in_minutes: 15,
      },
    })

    await appendAuditEventWorkflow(container).run({
      input: {
        correlation_id: correlationId,
        actor_id: "system",
        actor_type: "system",
        auth_identity_id: null,
        action: "auth.customer.password_reset.notification",
        resource_type: "auth_identity",
        resource_id: null,
        outcome: "success",
        status_code: 200,
        after: {
          identifier_hash: hashRecoveryIdentifier(event.data.entity_id),
          template: "password-reset",
        },
        metadata: {
          actor_type: event.data.actor_type,
        },
      },
    })
  } catch (error) {
    await appendAuditEventWorkflow(container).run({
      input: {
        correlation_id: correlationId,
        actor_id: "system",
        actor_type: "system",
        auth_identity_id: null,
        action: "auth.customer.password_reset.notification",
        resource_type: "auth_identity",
        resource_id: null,
        outcome: "error",
        status_code: 502,
        after: {
          identifier_hash: hashRecoveryIdentifier(event.data.entity_id),
          template: "password-reset",
        },
        metadata: {
          actor_type: event.data.actor_type,
        },
      },
    })

    throw error
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
  context: {
    subscriberId: "customer-password-reset",
  },
}
