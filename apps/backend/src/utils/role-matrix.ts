export const SECURITY_ROLE_MANAGED_BY = "dtc-security-role-matrix-v1"

type Permission = {
  resource: string
  operation: "create" | "read" | "update" | "delete" | "*"
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

export const SECURITY_ROLE_MATRIX: SecurityRoleDefinition[] = [
  {
    name: "Owner",
    description: "Business owner with full administrative access",
    permissions: [{ resource: "*", operation: "*" }],
  },
  {
    name: "Catalog Manager",
    description: "Manages catalog, inventory, pricing, and promotions",
    permissions: all(catalogResources),
  },
  {
    name: "Order & Fulfillment",
    description: "Operates orders, returns, shipping, and fulfillment",
    permissions: [
      ...all(orderResources),
      ...operations(["customer", "customer_address"], ["read"]),
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
    ],
  },
  {
    name: "Read-only Auditor",
    description: "Reads all administrative resources and audit evidence",
    permissions: [{ resource: "*", operation: "read" }],
  },
]
