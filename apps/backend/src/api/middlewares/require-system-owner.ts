import type {
  AuthContext,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { userIsSystemOwner } from "../../utils/system-access"

export async function requireSystemOwner(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const authContext = (
      req as MedusaRequest & { auth_context?: AuthContext }
    ).auth_context

    if (authContext?.actor_type !== "user" || !authContext.actor_id) {
      return next(
        new MedusaError(MedusaError.Types.UNAUTHORIZED, "UNAUTHORIZED")
      )
    }

    if (!(await userIsSystemOwner(req.scope, authContext.actor_id))) {
      return next(
        new MedusaError(
          MedusaError.Types.FORBIDDEN,
          "SYSTEM_OWNER_REQUIRED"
        )
      )
    }

    return next()
  } catch (error) {
    return next(error)
  }
}

export async function requireSystemOwnerUnlessSelf(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const authContext = (
    req as MedusaRequest & { auth_context?: AuthContext }
  ).auth_context
  const requestPath = req.originalUrl.split("?", 1)[0]
  const targetUserId = req.params.id || requestPath.match(
    /^\/admin\/users\/([^/]+)$/
  )?.[1]

  if (
    targetUserId === "me" ||
    (authContext?.actor_type === "user" &&
      authContext.actor_id === targetUserId)
  ) {
    return next()
  }

  return requireSystemOwner(req, res, next)
}
