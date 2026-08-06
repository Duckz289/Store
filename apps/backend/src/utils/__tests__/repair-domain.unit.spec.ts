import { MedusaError } from "@medusajs/framework/utils"

import {
  assertRepairTransition,
  calculateQuote,
  hashPhone,
  maskSensitiveIdentifier,
  normalizeVietnamPhone,
  stableHash,
} from "../repair-domain"

describe("repair domain", () => {
  it("accepts only declared state transitions", () => {
    expect(() => assertRepairTransition("intake", "diagnosis")).not.toThrow()
    expect(() => assertRepairTransition("intake", "closed")).toThrow(
      "REPAIR_TRANSITION_NOT_ALLOWED:intake:closed"
    )
  })

  it("requires quote, QA, handover, and settled part facts", () => {
    expect(() =>
      assertRepairTransition("quote", "awaiting_customer_decision")
    ).toThrow("REPAIR_SUBMITTED_QUOTE_REQUIRED")
    expect(() =>
      assertRepairTransition("quality_assurance", "return_ready")
    ).toThrow("REPAIR_QA_EVIDENCE_REQUIRED")
    expect(() => assertRepairTransition("return_ready", "returned")).toThrow(
      "REPAIR_HANDOVER_EVIDENCE_REQUIRED"
    )
    expect(() =>
      assertRepairTransition("returned", "closed", { hasPendingParts: true })
    ).toThrow("REPAIR_PENDING_PART_USAGE")
  })

  it("calculates quote amounts on the server and validates signed discounts", () => {
    expect(
      calculateQuote([
        { kind: "labor", title: "Labor", quantity: 2, unit_price: 100_000 },
        { kind: "discount", title: "Warranty", quantity: 1, unit_price: -50_000 },
      ])
    ).toMatchObject({ subtotal: 150_000, total: 150_000 })
    expect(() =>
      calculateQuote([
        { kind: "discount", title: "Bad", quantity: 1, unit_price: 1 },
      ])
    ).toThrow(MedusaError)
  })

  it("normalizes lookup data without exposing identifiers", () => {
    expect(normalizeVietnamPhone("+84 909 000 000")).toBe("0909000000")
    expect(hashPhone("+84 909 000 000")).toBe(hashPhone("0909000000"))
    expect(maskSensitiveIdentifier("123456789012345")).toBe("***********2345")
  })

  it("hashes object keys deterministically for idempotency", () => {
    expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }))
  })
})
