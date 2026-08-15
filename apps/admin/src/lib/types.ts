export type ListResponse<T, K extends string> = Record<K, T[]> & {
  count: number
  limit?: number
  offset?: number
}

export type Product = {
  id: string
  title: string
  handle?: string
  description?: string | null
  status?: string
  thumbnail?: string | null
  images?: { id?: string; url: string }[]
  categories?: { id: string; name: string; handle?: string }[]
  sales_channels?: SalesChannel[]
  collection?: { id: string; title: string } | null
  catalog?: ProductCatalog | null
  variants?: {
    id: string
    title?: string
    sku?: string | null
    manage_inventory?: boolean
    inventory_quantity?: number
    prices?: { id?: string; amount: number; currency_code: string }[]
    calculated_price?: { calculated_amount?: number; currency_code?: string }
    inventory_items?: {
      inventory?: { id: string; sku?: string | null }
    }[]
  }[]
}

export type SalesChannel = {
  id: string
  name: string
  is_disabled?: boolean
}

export type StockLocation = {
  id: string
  name: string
}

export type CatalogBrandKind = "manufacturer" | "store_label" | "unspecified"

export const CATALOG_BRAND_KIND_LABELS: Record<CatalogBrandKind, string> = {
  manufacturer: "Hãng sản xuất",
  store_label: "Nhãn cửa hàng",
  unspecified: "Không rõ thương hiệu",
}

export type CatalogBrand = {
  id: string
  name: string
  handle: string
  kind?: CatalogBrandKind | null
  logo_url?: string | null
  logo_alt?: string | null
}
export type CatalogSpecification = {
  key: string
  label: string
  value: string
  unit: string
  group: string
  filterable?: boolean
  featured?: boolean
  /** Comma-separated values, each becoming its own filter chip on the storefront. */
  multi?: boolean
  position: number
}

export type ProductCategory = {
  id: string
  name: string
  handle: string
  is_active?: boolean
  rank?: number
  parent_category_id?: string | null
  parent_category?: { id: string; name: string; handle?: string } | null
}
export type ProductCatalog = {
  brand?: CatalogBrand | null
  model?: string | null
  specifications?: { items?: CatalogSpecification[] }
  media_alt_text?: Record<string, string>
  /** "demo_fixture" marks seeded sample rows whose price and stock are unverified. */
  data_source?: "real" | "demo_fixture" | null
  internal_note?: string | null
}

export type Order = {
  id: string
  display_id?: number
  email?: string
  created_at?: string
  currency_code?: string
  total?: number
  subtotal?: number
  shipping_total?: number
  discount_total?: number
  tax_total?: number
  payment_status?: string
  fulfillment_status?: string
  status?: string
  customer?: {
    id?: string
    first_name?: string
    last_name?: string
    email?: string
  }
  shipping_address?: Address | null
  billing_address?: Address | null
  items?: {
    id: string
    title?: string
    variant_title?: string
    quantity: number
    unit_price?: number
    total?: number
    variant?: { sku?: string | null }
  }[]
}

export type Address = {
  first_name?: string
  last_name?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
  phone?: string
}

export type Promotion = {
  id: string
  code?: string
  type?: string
  status?: string
  starts_at?: string | null
  ends_at?: string | null
  campaign?: {
    id: string
    name?: string | null
    starts_at?: string | null
    ends_at?: string | null
  }
  application_method?: {
    type?: string
    target_type?: string
    allocation?: string
    value?: number
    currency_code?: string | null
  }
}

export type RepairStatus =
  | "intake"
  | "diagnosis"
  | "quote"
  | "awaiting_customer_decision"
  | "repair"
  | "quality_assurance"
  | "return_ready"
  | "returned"
  | "closed"
  | "canceled"

export type RepairCase = {
  id: string
  code: string
  status: RepairStatus
  revision: number
  public_summary?: string | null
  sla_due_at?: string | null
  created_at: string
  updated_at: string
  device?: {
    device_type: string
    brand?: string | null
    model: string
    serial_number?: string | null
    condition_summary?: string
    sku?: string | null
  } | null
  diagnoses?: {
    id: string
    version: number
    severity: string
    findings: string
    recommended_action: string
    diagnosed_by_name?: string | null
    completed_at: string
  }[]
  quotes?: {
    id: string
    version: number
    status: string
    currency_code: string
    total: number
    valid_until?: string | null
    items?: {
      id: string
      title: string
      sku?: string | null
      quantity: number
      line_total: number
    }[]
  }[]
  parts?: {
    id: string
    status: string
    title: string
    sku?: string | null
    quantity: number
  }[]
  assignments?: {
    id: string
    technician_name: string
    assigned_at: string
    ended_at?: string | null
  }[]
  status_history?: {
    id: string
    from_status?: RepairStatus | null
    to_status: RepairStatus
    occurred_at: string
    sequence: number
  }[]
}

export type InventoryItem = {
  id: string
  sku?: string | null
  title?: string | null
  location_levels?: {
    id?: string
    location_id?: string
    stocked_quantity?: number
    reserved_quantity?: number
    available_quantity?: number
    location?: { name?: string }
  }[]
}

export type Customer = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string
  phone?: string | null
  created_at?: string
  addresses?: Address[]
}

export type StaffUser = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string
  created_at?: string
  rbac_roles?: { id: string; name: string }[]
  is_system_owner?: boolean
}

export type StaffRole = {
  id: string
  name: string
  description?: string | null
  assignable: boolean
}

export type SystemAccess = {
  is_system_owner: boolean
  can_manage_system: boolean
  role_names: string[]
}

export type SystemHealth = {
  status: "healthy" | "degraded" | "unhealthy"
  checked_at: string
  uptime_seconds: number
  memory: { rss_mb: number; heap_used_mb: number }
  checks: {
    id: string
    label: string
    status: "pass" | "warn" | "fail"
    critical: boolean
    latency_ms: number
    message: string
    details?: Record<string, unknown>
  }[]
  traces: {
    correlation_id: string
    method: string
    path: string
    status_code: number
    duration_ms: number
    actor_id?: string | null
    occurred_at: string
  }[]
  recent_audit: AuditEvent[]
}

export type AuditEvent = {
  id: string
  actor_id?: string | null
  action?: string
  resource_type?: string
  resource_id?: string | null
  outcome?: string
  occurred_at?: string
  correlation_id?: string | null
}
