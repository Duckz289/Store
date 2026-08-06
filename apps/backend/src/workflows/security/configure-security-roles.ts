import type { IRbacModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
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
  SECURITY_ROLE_MANAGED_BY,
  SECURITY_ROLE_MATRIX,
} from "../../utils/role-matrix"

const configureSecurityRolesStep = createStep(
  "configure-security-roles",
  async (_, { container }) => {
    const rbacService = container.resolve<IRbacModuleService>(Modules.RBAC)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const permissionKeys = [
      ...new Set(
        SECURITY_ROLE_MATRIX.flatMap((role) =>
          role.permissions.map(
            (permission) =>
              `${permission.resource}:${permission.operation}`
          )
        )
      ),
    ]
    const existingPolicies = await rbacService.listRbacPolicies({
      key: permissionKeys,
    })
    const policyByKey = new Map(
      existingPolicies.map((policy) => [policy.key, policy])
    )

    const missingPolicyKeys = permissionKeys.filter(
      (key) => !policyByKey.has(key)
    )
    if (missingPolicyKeys.length) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Security role policies are not registered: ${missingPolicyKeys.join(", ")}`
      )
    }

    const allRoles = await rbacService.listRbacRoles()
    const roleByName = new Map(allRoles.map((role) => [role.name, role]))
    let createdRoles = 0
    let createdLinks = 0

    for (const definition of SECURITY_ROLE_MATRIX) {
      let role = roleByName.get(definition.name)
      if (!role) {
        role = await rbacService.createRbacRoles({
          name: definition.name,
          description: definition.description,
          metadata: { managed_by: SECURITY_ROLE_MANAGED_BY },
        })
        roleByName.set(role.name, role)
        createdRoles += 1
      } else {
        role = await rbacService.updateRbacRoles({
          id: role.id,
          description: definition.description,
          metadata: {
            ...(role.metadata ?? {}),
            managed_by: SECURITY_ROLE_MANAGED_BY,
          },
        })
      }

      const desiredPolicyIds = definition.permissions.map((permission) => {
        const policy = policyByKey.get(
          `${permission.resource}:${permission.operation}`
        )

        if (!policy) {
          throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            "Security role policy reconciliation failed"
          )
        }

        return policy.id
      })
      const existingLinks = await rbacService.listRbacRolePolicies({
        role_id: role.id,
      })
      const existingPolicyIds = new Set(
        existingLinks.map((link) => link.policy_id)
      )
      const missingPolicyIds = desiredPolicyIds.filter(
        (policyId) => !existingPolicyIds.has(policyId)
      )

      if (missingPolicyIds.length) {
        await rbacService.createRbacRolePolicies(
          missingPolicyIds.map((policyId) => ({
            role_id: role.id,
            policy_id: policyId,
            metadata: { managed_by: SECURITY_ROLE_MANAGED_BY },
          }))
        )
        createdLinks += missingPolicyIds.length
      }

      const desiredPolicyIdSet = new Set(desiredPolicyIds)
      const staleManagedLinks = existingLinks.filter(
        (link) =>
          link.metadata?.managed_by === SECURITY_ROLE_MANAGED_BY &&
          !desiredPolicyIdSet.has(link.policy_id)
      )

      if (staleManagedLinks.length) {
        await rbacService.deleteRbacRolePolicies(
          staleManagedLinks.map((link) => link.id)
        )
      }
    }

    await securityService.createAuditEvents(
      prepareAuditEvent({
        correlation_id: `security-seed-${Date.now()}`,
        actor_id: "system",
        actor_type: "system",
        action: "rbac.role_matrix.reconcile",
        resource_type: "rbac_role",
        outcome: "success",
        metadata: {
          managed_by: SECURITY_ROLE_MANAGED_BY,
          role_count: SECURITY_ROLE_MATRIX.length,
          created_roles: createdRoles,
          created_links: createdLinks,
        },
      })
    )

    return new StepResponse({
      roles: SECURITY_ROLE_MATRIX.map((role) => role.name),
      created_roles: createdRoles,
      created_links: createdLinks,
    })
  }
)

export const configureSecurityRolesWorkflow = createWorkflow(
  "configure-security-roles",
  () => {
    const result = configureSecurityRolesStep()

    return new WorkflowResponse(result)
  }
)
