import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import {
  AuditEventInput,
  prepareAuditEvent,
} from "../../utils/security-audit"

const appendAuditEventStep = createStep(
  "append-audit-event",
  async (input: AuditEventInput, { container }) => {
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const event = await securityService.createAuditEvents(
      prepareAuditEvent(input)
    )

    return new StepResponse(event)
  }
)

export const appendAuditEventWorkflow = createWorkflow(
  "append-audit-event",
  (input: AuditEventInput) => {
    const event = appendAuditEventStep(input)

    return new WorkflowResponse(event)
  }
)
