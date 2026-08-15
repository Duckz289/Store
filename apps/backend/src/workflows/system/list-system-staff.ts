import type { IRbacModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import {
  SECURITY_ROLE_MATRIX,
  SYSTEM_OWNER_ROLE,
} from "../../utils/role-matrix"

const listSystemStaffStep = createStep(
  "list-system-staff",
  async (_, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
    const [{ data: users }, roles] = await Promise.all([
      query.graph({
        entity: "user",
        fields: [
          "id",
          "email",
          "first_name",
          "last_name",
          "created_at",
          "rbac_roles.id",
          "rbac_roles.name",
        ],
      }),
      rbacService.listRbacRoles(),
    ])
    const managedRoleNames = new Set(
      SECURITY_ROLE_MATRIX.map((definition) => definition.name)
    )
    const managedRoles = roles
      .filter((role) => managedRoleNames.has(role.name))
      .map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        assignable: role.name !== SYSTEM_OWNER_ROLE,
      }))
      .sort((left, right) => left.name.localeCompare(right.name))
    const normalizedUsers = (users as unknown as Array<{
      id: string
      email?: string | null
      first_name?: string | null
      last_name?: string | null
      created_at?: string
      rbac_roles?: { id: string; name: string }[]
    }>).map((user) => ({
      ...user,
      is_system_owner: user.rbac_roles?.some(
        (role) => role.name === SYSTEM_OWNER_ROLE
      ) ?? false,
    }))

    return new StepResponse({
      users: normalizedUsers,
      roles: managedRoles,
      system_owner_count: normalizedUsers.filter(
        (user) => user.is_system_owner
      ).length,
    })
  }
)

export const listSystemStaffWorkflow = createWorkflow(
  "list-system-staff",
  () => new WorkflowResponse(listSystemStaffStep())
)
