import { PolicyResource } from "@medusajs/framework/utils"

const unsafeResourceAliases: Record<string, string> = {
  "*": "ALL_RESOURCES",
  return: "RETURN_RESOURCE",
}

// Medusa 2.18 writes resource registry keys into generated TypeScript without
// quoting them. Keep the original runtime keys accessible but non-enumerable,
// and expose safe aliases for the type generator.
for (const [resource, alias] of Object.entries(unsafeResourceAliases)) {
  const descriptor = Object.getOwnPropertyDescriptor(PolicyResource, resource)
  if (!descriptor || !descriptor.enumerable) continue

  if (!(alias in PolicyResource)) {
    Object.defineProperty(PolicyResource, alias, {
      configurable: true,
      enumerable: true,
      writable: false,
      value: descriptor.value,
    })
  }
  Object.defineProperty(PolicyResource, resource, {
    ...descriptor,
    enumerable: false,
  })
}
