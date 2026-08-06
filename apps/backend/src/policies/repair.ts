import { definePolicies, PolicyOperation } from "@medusajs/framework/utils"

const crudResources = [
  "repair_case",
  "repair_device",
  "repair_diagnosis",
  "repair_quote",
  "repair_quote_decision",
  "repair_part_usage",
  "repair_assignment",
  "repair_attachment",
  "repair_status_history",
  "repair_reconciliation_issue",
]

const crudOperations = [
  PolicyOperation.create,
  PolicyOperation.read,
  PolicyOperation.update,
  PolicyOperation.delete,
]

const toPolicyName = (operation: string, resource: string) =>
  `${operation[0].toUpperCase()}${operation.slice(1)}${resource
    .split("_")
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("")}`

export const repairPolicies = definePolicies([
  ...crudResources.flatMap((resource) =>
    crudOperations.map((operation) => ({
      name: toPolicyName(operation, resource),
      description: `${operation} ${resource.replaceAll("_", " ")}`,
      resource,
      operation,
    }))
  ),
  {
    name: "ReadSensitiveRepairContact",
    description: "Read unredacted repair customer contact snapshots",
    resource: "repair_contact",
    operation: "read_sensitive",
  },
  {
    name: "UpdateSensitiveRepairContact",
    description: "Update repair customer contact snapshots",
    resource: "repair_contact",
    operation: "update_sensitive",
  },
  {
    name: "TransitionRepairCase",
    description: "Run an allowed repair case state transition",
    resource: "repair_case",
    operation: "transition",
  },
  {
    name: "ReadInternalRepairDiagnosis",
    description: "Read internal technician diagnosis notes",
    resource: "repair_diagnosis",
    operation: "read_internal",
  },
  {
    name: "SubmitRepairQuote",
    description: "Freeze and submit a repair quote to a customer",
    resource: "repair_quote",
    operation: "submit",
  },
  {
    name: "ReverseRepairPartUsage",
    description: "Reverse repair part usage and inventory movement",
    resource: "repair_part_usage",
    operation: "reverse",
  },
  {
    name: "ReconcileRepairData",
    description: "Run repair consistency reconciliation",
    resource: "repair_reconciliation_issue",
    operation: "reconcile",
  },
])
