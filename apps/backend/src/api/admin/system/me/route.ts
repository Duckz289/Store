import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { isSystemOwnerRole } from "../../../../utils/role-matrix"
import {
  getUserWithRoles,
  readRoleNames,
} from "../../../../utils/system-access"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context.actor_id
  if (!actorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "UNAUTHORIZED")
  }
  const user = await getUserWithRoles(req.scope, actorId)
  if (!user) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "USER_NOT_FOUND")
  }
  const roleNames = readRoleNames(user)

  return res.status(200).json({
    user,
    access: {
      is_system_owner: isSystemOwnerRole(roleNames),
      can_manage_system: isSystemOwnerRole(roleNames),
      role_names: roleNames,
    },
  })
}
