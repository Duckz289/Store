import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { configureSecurityRolesWorkflow } from "../workflows/security/configure-security-roles"

export default async function seedSecurityRoles({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { result } = await configureSecurityRolesWorkflow(container).run()

  logger.info(
    `Security role matrix reconciled: ${result.roles.length} roles, ${result.created_roles} created, ${result.created_links} policy links created`
  )
}
