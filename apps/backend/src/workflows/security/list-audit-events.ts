import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { verifyAuditEventIntegrity } from "../../utils/security-audit"

export type ListAuditEventsInput = {
  actor_id?: string
  correlation_id?: string
  resource_type?: string
  limit: number
  offset: number
}

const listAuditEventsStep = createStep(
  "list-audit-events",
  async (input: ListAuditEventsInput, { container }) => {
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const filters = {
      ...(input.actor_id ? { actor_id: input.actor_id } : {}),
      ...(input.correlation_id
        ? { correlation_id: input.correlation_id }
        : {}),
      ...(input.resource_type
        ? { resource_type: input.resource_type }
        : {}),
    }
    const [events, count] = await securityService.listAndCountAuditEvents(
      filters,
      {
        order: { occurred_at: "DESC" },
        skip: input.offset,
        take: input.limit,
      }
    )

    return new StepResponse({
      audit_events: events.map((event) => ({
        ...event,
        integrity_valid: verifyAuditEventIntegrity(event),
      })),
      count,
      limit: input.limit,
      offset: input.offset,
    })
  }
)

export const listAuditEventsWorkflow = createWorkflow(
  "list-audit-events",
  (input: ListAuditEventsInput) => {
    const events = listAuditEventsStep(input)

    return new WorkflowResponse(events)
  }
)
