import { maskSensitiveIdentifier } from "./repair-domain"

type RepairDeviceView = {
  device_type: string
  brand: string | null
  model: string
  color: string | null
  serial_number: string | null
  imei: string | null
  condition_summary: string
  accessories: Record<string, unknown> | null
  product_title: string | null
  variant_title: string | null
  sku: string | null
  order_display_id: string | null
}

type RepairCaseView = {
  id: string
  code: string
  status: string
  revision: number
  public_summary: string | null
  sla_due_at: Date | null
  promised_due_at: Date | null
  received_at: Date | null
  ready_at: Date | null
  returned_at: Date | null
  closed_at: Date | null
  canceled_at: Date | null
  created_at: Date
  updated_at: Date
  device?: RepairDeviceView | null
}

export function presentRepairCase(caseRecord: RepairCaseView) {
  return {
    id: caseRecord.id,
    code: caseRecord.code,
    status: caseRecord.status,
    revision: caseRecord.revision,
    public_summary: caseRecord.public_summary,
    sla_due_at: caseRecord.sla_due_at,
    promised_due_at: caseRecord.promised_due_at,
    received_at: caseRecord.received_at,
    ready_at: caseRecord.ready_at,
    returned_at: caseRecord.returned_at,
    closed_at: caseRecord.closed_at,
    canceled_at: caseRecord.canceled_at,
    created_at: caseRecord.created_at,
    updated_at: caseRecord.updated_at,
    device: caseRecord.device
      ? {
          device_type: caseRecord.device.device_type,
          brand: caseRecord.device.brand,
          model: caseRecord.device.model,
          color: caseRecord.device.color,
          serial_number: maskSensitiveIdentifier(
            caseRecord.device.serial_number
          ),
          imei: maskSensitiveIdentifier(caseRecord.device.imei),
          condition_summary: caseRecord.device.condition_summary,
          accessories: caseRecord.device.accessories,
          product_title: caseRecord.device.product_title,
          variant_title: caseRecord.device.variant_title,
          sku: caseRecord.device.sku,
          order_display_id: caseRecord.device.order_display_id,
        }
      : null,
  }
}

export function presentRepairContact(contact: {
  id: string
  full_name: string
  phone_normalized: string
  email: string | null
  consented_at: Date
  anonymized_at: Date | null
}) {
  return {
    id: contact.id,
    full_name: contact.full_name,
    phone: contact.phone_normalized,
    email: contact.email,
    consented_at: contact.consented_at,
    anonymized_at: contact.anonymized_at,
  }
}
