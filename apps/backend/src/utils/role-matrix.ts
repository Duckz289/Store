export const SECURITY_ROLE_MANAGED_BY = "dtc-security-role-matrix-v1"

type Permission = {
  resource: string
  operation: string
}

export type SecurityRoleDefinition = {
  name: string
  description: string
  permissions: Permission[]
}

const all = (resources: string[]): Permission[] =>
  operations(resources, ["create", "read", "update", "delete"])

const operations = (
  resources: string[],
  allowed: Permission["operation"][]
): Permission[] =>
  resources.flatMap((resource) =>
    allowed.map((operation) => ({ resource, operation }))
  )

const catalogResources = [
  "product",
  "product_variant",
  "product_option",
  "product_option_value",
  "product_tag",
  "product_type",
  "product_category",
  "product_collection",
  "inventory_item",
  "inventory_level",
  "reservation_item",
  "price_list",
  "price_preference",
  "price",
  "campaign",
  "promotion",
  "file",
]

const orderResources = [
  "order",
  "order_item",
  "order_change",
  "order_claim",
  "order_claim_item",
  "order_exchange",
  "return",
  "return_reason",
  "shipping_option",
  "shipping_option_type",
  "shipping_profile",
  "fulfillment",
  "fulfillment_provider",
  "fulfillment_set",
  "service_zone",
]

const paymentResources = [
  "payment",
  "payment_collection",
  "payment_method",
  "payment_session",
  "refund_reason",
]

const repairReadResources = [
  "repair_case",
  "repair_device",
  "repair_diagnosis",
  "repair_quote",
  "repair_quote_decision",
  "repair_part_usage",
  "repair_assignment",
  "repair_attachment",
  "repair_status_history",
]

export const SECURITY_ROLE_MATRIX: SecurityRoleDefinition[] = [
  {
    name: "Owner",
    description: "Business owner with full administrative access",
    permissions: [{ resource: "*", operation: "*" }],
  },
  {
    name: "Catalog Manager",
    description: "Manages catalog, inventory, pricing, and promotions",
    permissions: [
      ...all(catalogResources),
      ...operations(["repair_part_usage"], ["read"]),
    ],
  },
  {
    name: "Order & Fulfillment",
    description: "Operates orders, returns, shipping, and fulfillment",
    permissions: [
      ...all(orderResources),
      ...operations(["customer", "customer_address"], ["read"]),
      ...operations(repairReadResources, ["read"]),
      ...operations(["repair_case"], ["transition"]),
      ...operations(["repair_contact"], ["read_sensitive"]),
    ],
  },
  {
    name: "Finance",
    description: "Manages payment and pricing records; reads orders",
    permissions: [
      ...all(paymentResources),
      ...all(["price_list", "price_preference", "price", "currency"]),
      ...operations(["order", "order_item", "customer"], ["read"]),
      ...operations(["campaign", "promotion"], ["read"]),
      ...operations(
        ["repair_case", "repair_quote", "repair_quote_decision"],
        ["read"]
      ),
    ],
  },
  {
    name: "Support",
    description: "Supports customers and updates non-financial order details",
    permissions: [
      ...operations(
        ["customer", "customer_address", "order", "order_item"],
        ["read", "update"]
      ),
      ...operations(["fulfillment", "return"], ["read"]),
      ...operations(repairReadResources, ["read"]),
      ...operations(["repair_case", "repair_attachment"], ["create"]),
      ...operations(["repair_case", "repair_device"], ["update"]),
      ...operations(["repair_case"], ["transition"]),
      ...operations(
        ["repair_contact"],
        ["read_sensitive", "update_sensitive"]
      ),
    ],
  },
  {
    name: "Repair Technician",
    description: "Diagnoses and repairs assigned devices without contact PII",
    permissions: [
      ...operations(repairReadResources, ["read"]),
      ...operations(["repair_case"], ["transition"]),
      ...operations(["repair_diagnosis"], ["read_internal"]),
      ...operations(
        ["repair_diagnosis", "repair_quote", "repair_part_usage", "repair_attachment"],
        ["create", "update"]
      ),
      ...operations(["repair_quote"], ["submit"]),
      ...operations(["repair_part_usage"], ["reverse"]),
    ],
  },
  {
    name: "Read-only Auditor",
    description: "Reads all administrative resources and audit evidence",
    permissions: [{ resource: "*", operation: "read" }],
  },
]
