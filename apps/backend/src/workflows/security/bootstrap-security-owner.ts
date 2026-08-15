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
import {
  BUSINESS_OWNER_ROLE,
  LEGACY_SUPER_ADMIN_ROLE,
  SYSTEM_OWNER_ROLE,
} from "../../utils/role-matrix"

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
      fields: ["id", "rbac_roles.id", "rbac_roles.name"],
    })
    const usersWithRoles = data as unknown as {
      id: string
      rbac_roles?: { id: string; name: string }[]
    }[]
    const userWithRoles = usersWithRoles.find((item) => item.id === user.id)
    const roleIds = userWithRoles?.rbac_roles?.map((role) => role.id) ?? []
    const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
    const allRoles = await rbacService.listRbacRoles()
    const ownerRole = allRoles.find((role) => role.name === SYSTEM_OWNER_ROLE)
    const businessOwnerRole = allRoles.find(
      (role) => role.name === BUSINESS_OWNER_ROLE
    )
    const legacySuperAdminRole = allRoles.find(
      (role) => role.name === LEGACY_SUPER_ADMIN_ROLE
    )

    if (!ownerRole) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "System Owner role was not found; run security:seed first"
      )
    }
    if (!businessOwnerRole) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Owner role was not found; run security:seed first"
      )
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const duplicateOwnerLinks = usersWithRoles.flatMap((item) =>
      item.id === user.id
        ? []
        : (item.rbac_roles ?? [])
            .filter((role) => role.id === ownerRole.id)
            .map(() => ({
              [Modules.USER]: { user_id: item.id },
              [Modules.RBAC]: { rbac_role_id: ownerRole.id },
            }))
    )
    for (const definition of duplicateOwnerLinks) {
      await link.dismiss(definition)
    }

    let normalizedLegacyAccounts = 0
    if (legacySuperAdminRole) {
      for (const item of usersWithRoles) {
        const legacyAssignment = item.rbac_roles?.some(
          (role) => role.id === legacySuperAdminRole.id
        )
        if (!legacyAssignment) continue

        await link.dismiss({
          [Modules.USER]: { user_id: item.id },
          [Modules.RBAC]: { rbac_role_id: legacySuperAdminRole.id },
        })
        if (
          item.id !== user.id &&
          !item.rbac_roles?.some((role) => role.id === businessOwnerRole.id)
        ) {
          await link.create({
            [Modules.USER]: { user_id: item.id },
            [Modules.RBAC]: { rbac_role_id: businessOwnerRole.id },
          })
        }
        normalizedLegacyAccounts += 1
      }
    }

    const redundantTargetRoles = (userWithRoles?.rbac_roles ?? []).filter(
      (role) =>
        role.id !== ownerRole.id && role.id !== legacySuperAdminRole?.id
    )
    for (const role of redundantTargetRoles) {
      await link.dismiss({
        [Modules.USER]: { user_id: user.id },
        [Modules.RBAC]: { rbac_role_id: role.id },
      })
    }

    let assigned = false
    if (!roleIds.includes(ownerRole.id)) {
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
        action: "rbac.system_owner.bootstrap",
        resource_type: "user",
        resource_id: user.id,
        outcome: "success",
        metadata: {
          assigned,
          revoked_duplicate_assignments: duplicateOwnerLinks.length,
          normalized_legacy_accounts: normalizedLegacyAccounts,
          removed_redundant_target_roles: redundantTargetRoles.length,
        },
      })
    )

    return new StepResponse({
      user_id: user.id,
      assigned,
      revoked_duplicate_assignments: duplicateOwnerLinks.length,
      normalized_legacy_accounts: normalizedLegacyAccounts,
      removed_redundant_target_roles: redundantTargetRoles.length,
    })
  }
)

export const bootstrapSecurityOwnerWorkflow = createWorkflow(
  "bootstrap-security-owner",
  (input: BootstrapSecurityOwnerInput) => {
    const result = bootstrapSecurityOwnerStep(input)

    return new WorkflowResponse(result)
  }
)
