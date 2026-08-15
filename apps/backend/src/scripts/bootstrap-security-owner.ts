import type { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

import { bootstrapSecurityOwnerWorkflow } from "../workflows/security/bootstrap-security-owner"

export default async function bootstrapSecurityOwner({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const email = (
    process.env.SYSTEM_OWNER_EMAIL ?? process.env.SECURITY_OWNER_EMAIL
  )
    ?.trim()
    .toLowerCase()

  if (!email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "SYSTEM_OWNER_EMAIL is required"
    )
  }

  const { result } = await bootstrapSecurityOwnerWorkflow(container).run({
    input: { email },
  })

  logger.info(
    `System owner bootstrap completed for user ${result.user_id}; assigned=${result.assigned}; revoked_duplicates=${result.revoked_duplicate_assignments}; normalized_legacy_accounts=${result.normalized_legacy_accounts}; removed_redundant_target_roles=${result.removed_redundant_target_roles}`
  )
}
