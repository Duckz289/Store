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
  public_summary: string | null
  sla_due_at: string | null
  promised_due_at: string | null
  created_at: string
  updated_at: string
  device: {
    device_type: string
    brand: string | null
    model: string
    serial_number: string | null
    imei: string | null
    condition_summary: string
    sku?: string | null
    product_title?: string | null
    variant_title?: string | null
  } | null
  diagnoses?: {
    id: string
    version: number
    severity: string
    findings: string
    recommended_action: string
    completed_at: string
    diagnosed_by_name?: string | null
  }[]
  quotes?: {
    id: string
    version: number
    status: string
    currency_code: string
    total: number
    valid_until: string | null
    subtotal?: number
    submitted_at?: string | null
    decided_at?: string | null
    items?: {
      id: string
      kind: string
      title: string
      sku: string | null
      quantity: number
      unit_price: number
      line_total: number
    }[]
    decisions?: { id: string; decision: string; decided_at: string }[]
  }[]
  parts?: {
    id: string
    status: string
    title: string
    sku: string | null
    quantity: number
  }[]
  attachments?: {
    id: string
    classification: string
    mime_type: string
    created_at: string
  }[]
  assignments?: {
    id: string
    technician_name: string
    assigned_at: string
    ended_at: string | null
  }[]
  status_history?: {
    id: string
    from_status: RepairStatus | null
    to_status: RepairStatus
    occurred_at: string
    sequence: number
  }[]
}

export type RepairListResponse = {
  repair_cases: RepairCase[]
  count: number
  limit: number
  offset: number
}

export type RepairDetailResponse = {
  repair_case: RepairCase
}

export type RepairContactResponse = {
  contact: {
    full_name: string
    phone: string
    email: string | null
    consented_at: string
    anonymized_at: string | null
  } | null
}
