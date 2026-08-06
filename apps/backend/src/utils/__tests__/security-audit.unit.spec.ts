import {
  prepareAuditEvent,
  redactAuditData,
  verifyAuditEventIntegrity,
} from "../security-audit"

describe("security audit data", () => {
  it("redacts credentials and direct PII recursively", () => {
    const redacted = redactAuditData({
      email: "admin@example.com",
      profile: {
        phone: "0909000000",
        address_1: "1 Main Street",
      },
      authorization: "Bearer raw-token",
      payment: {
        card_number: "4111111111111111",
      },
      safe: "catalog-change",
    })

    expect(redacted).toEqual({
      authorization: "<redacted:secret>",
      email: "<redacted:email>",
      payment: {
        card_number: "<redacted:secret>",
      },
      profile: {
        address_1: "<redacted:address>",
        phone: "<redacted:phone>",
      },
      safe: "catalog-change",
    })
  })

  it("detects content tampering without exposing raw secrets", () => {
    const event = prepareAuditEvent({
      correlation_id: "request-123",
      actor_id: "user_123",
      action: "payment.update",
      resource_type: "payment",
      resource_id: "pay_123",
      outcome: "success",
      occurred_at: new Date("2026-08-06T00:00:00.000Z"),
      after: {
        token: "must-not-survive",
        status: "captured",
      },
    })

    expect(event.after).toEqual({
      status: "captured",
      token: "<redacted:secret>",
    })
    expect(verifyAuditEventIntegrity(event)).toBe(true)
    expect(
      verifyAuditEventIntegrity({
        ...event,
        action: "payment.delete",
      })
    ).toBe(false)
  })

  it("redacts repair device and diagnosis payloads", () => {
    expect(
      redactAuditData({
        contact: { full_name: "Nguyen Van A" },
        device: {
          serial_number: "SERIAL-SECRET",
          imei: "123456789012345",
          condition_summary: "Contains a private lock-screen message",
        },
        diagnosis: {
          findings: "Customer data visible",
          internal_note: "Technician-only detail",
        },
      })
    ).toEqual({
      contact: { full_name: "<redacted:repair-sensitive>" },
      device: {
        condition_summary: "<redacted:repair-sensitive>",
        imei: "<redacted:repair-sensitive>",
        serial_number: "<redacted:repair-sensitive>",
      },
      diagnosis: {
        findings: "<redacted:repair-sensitive>",
        internal_note: "<redacted:repair-sensitive>",
      },
    })
  })

  it("uses a nonce so equivalent events remain distinct", () => {
    const input = {
      correlation_id: "request-123",
      action: "order.read",
      resource_type: "order",
      outcome: "success" as const,
      occurred_at: new Date("2026-08-06T00:00:00.000Z"),
    }

    expect(prepareAuditEvent(input).event_hash).not.toBe(
      prepareAuditEvent(input).event_hash
    )
  })
})
