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
  const email = process.env.SECURITY_OWNER_EMAIL?.trim().toLowerCase()

  if (!email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "SECURITY_OWNER_EMAIL is required"
    )
  }

  const { result } = await bootstrapSecurityOwnerWorkflow(container).run({
    input: { email },
  })

  logger.info(
    `Security owner bootstrap completed for user ${result.user_id}; assigned=${result.assigned}`
  )
}
