import {
  definePolicies,
  PolicyOperation,
} from "@medusajs/framework/utils"

export const securityPolicies = definePolicies([
  {
    name: "ReadAllResources",
    description: "Read all administrative resources",
    resource: "*",
    operation: PolicyOperation.read,
  },
  {
    name: "ReadAuditEvent",
    description: "Read and export security audit events",
    resource: "audit_event",
    operation: PolicyOperation.read,
  },
])
