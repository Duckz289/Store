import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { isSystemOwnerRole } from "./role-matrix"

type UserWithRoles = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  rbac_roles?: { id: string; name: string; description?: string | null }[]
}

export async function getUserWithRoles(
  container: MedusaContainer,
  userId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "user",
    fields: [
      "id",
      "email",
      "first_name",
      "last_name",
      "created_at",
      "rbac_roles.id",
      "rbac_roles.name",
      "rbac_roles.description",
    ],
    filters: { id: userId },
  })

  return data[0] as UserWithRoles | undefined
}

export function readRoleNames(user?: UserWithRoles) {
  return user?.rbac_roles?.map((role) => role.name) ?? []
}

export async function userIsSystemOwner(
  container: MedusaContainer,
  userId: string
) {
  const user = await getUserWithRoles(container, userId)

  return isSystemOwnerRole(readRoleNames(user))
}
