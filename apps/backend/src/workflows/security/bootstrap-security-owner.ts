import type {
  IRbacModuleService,
  IUserModuleService,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { prepareAuditEvent } from "../../utils/security-audit"

type BootstrapSecurityOwnerInput = {
  email: string
}

const bootstrapSecurityOwnerStep = createStep(
  "bootstrap-security-owner",
  async (input: BootstrapSecurityOwnerInput, { container }) => {
    const userService = container.resolve<IUserModuleService>(Modules.USER)
    const users = await userService.listUsers({ email: input.email })
    const user = users[0]

    if (!user) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Admin user ${input.email} was not found`
      )
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "user",
      fields: ["id", "rbac_roles.id"],
      filters: { id: user.id },
    })
    const userWithRoles = data[0] as unknown as {
      rbac_roles?: { id: string }[]
    }
    const roleIds = userWithRoles?.rbac_roles?.map((role) => role.id) ?? []
    const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
    const ownerRoles = await rbacService.listRbacRoles({ name: "Owner" })
    const ownerRole = ownerRoles[0]

    if (!ownerRole) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Owner role was not found; run security:seed first"
      )
    }

    let assigned = false
    if (!roleIds.includes(ownerRole.id)) {
      const link = container.resolve(ContainerRegistrationKeys.LINK)
      await link.create({
        [Modules.USER]: { user_id: user.id },
        [Modules.RBAC]: { rbac_role_id: ownerRole.id },
      })
      assigned = true
    }

    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    await securityService.createAuditEvents(
      prepareAuditEvent({
        correlation_id: `security-owner-bootstrap-${Date.now()}`,
        actor_id: "system",
        actor_type: "system",
        action: "rbac.owner.bootstrap",
        resource_type: "user",
        resource_id: user.id,
        outcome: "success",
        metadata: { assigned },
      })
    )

    return new StepResponse({ user_id: user.id, assigned })
  }
)

export const bootstrapSecurityOwnerWorkflow = createWorkflow(
  "bootstrap-security-owner",
  (input: BootstrapSecurityOwnerInput) => {
    const result = bootstrapSecurityOwnerStep(input)

    return new WorkflowResponse(result)
  }
)
