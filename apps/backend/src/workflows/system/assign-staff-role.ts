import type { IRbacModuleService } from "@medusajs/framework/types"
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
import {
  SECURITY_ROLE_MATRIX,
  SYSTEM_OWNER_ROLE,
} from "../../utils/role-matrix"
import { prepareAuditEvent } from "../../utils/security-audit"
import { userIsSystemOwner } from "../../utils/system-access"

export type AssignStaffRoleInput = {
  actor_id: string
  user_id: string
  role_id: string | null
  correlation_id: string
}

const assignStaffRoleStep = createStep(
  "assign-staff-role",
  async (input: AssignStaffRoleInput, { container }) => {
    if (!(await userIsSystemOwner(container, input.actor_id))) {
      throw new MedusaError(
        MedusaError.Types.FORBIDDEN,
        "SYSTEM_OWNER_REQUIRED"
      )
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "user",
      fields: ["id", "email", "rbac_roles.id", "rbac_roles.name"],
      filters: { id: input.user_id },
    })
    const user = data[0] as unknown as {
      id: string
      email?: string | null
      rbac_roles?: { id: string; name: string }[]
    }
    if (!user) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "USER_NOT_FOUND")
    }
    const currentRoles = user.rbac_roles ?? []
    if (currentRoles.some((role) => role.name === SYSTEM_OWNER_ROLE)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "SYSTEM_OWNER_ROLE_IS_BOOTSTRAP_ONLY"
      )
    }

    const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
    const roles = await rbacService.listRbacRoles()
    const desiredRole = input.role_id
      ? roles.find((role) => role.id === input.role_id)
      : undefined
    const assignableNames = new Set(
      SECURITY_ROLE_MATRIX.filter(
        (definition) => definition.name !== SYSTEM_OWNER_ROLE
      ).map((definition) => definition.name)
    )
    if (input.role_id && (!desiredRole || !assignableNames.has(desiredRole.name))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "STAFF_ROLE_NOT_ASSIGNABLE"
      )
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    for (const role of currentRoles) {
      await link.dismiss({
        [Modules.USER]: { user_id: user.id },
        [Modules.RBAC]: { rbac_role_id: role.id },
      })
    }
    if (desiredRole) {
      await link.create({
        [Modules.USER]: { user_id: user.id },
        [Modules.RBAC]: { rbac_role_id: desiredRole.id },
      })
    }

    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    await securityService.createAuditEvents(
      prepareAuditEvent({
        correlation_id: input.correlation_id,
        actor_id: input.actor_id,
        actor_type: "user",
        action: "rbac.staff_role.assigned",
        resource_type: "user",
        resource_id: user.id,
        outcome: "success",
        before: { roles: currentRoles.map((role) => role.name) },
        after: { roles: desiredRole ? [desiredRole.name] : [] },
      })
    )

    return new StepResponse({
      user: {
        id: user.id,
        email: user.email,
        rbac_roles: desiredRole
          ? [{ id: desiredRole.id, name: desiredRole.name }]
          : [],
      },
    })
  }
)

export const assignStaffRoleWorkflow = createWorkflow(
  "assign-staff-role",
  (input: AssignStaffRoleInput) =>
    new WorkflowResponse(assignStaffRoleStep(input))
)
