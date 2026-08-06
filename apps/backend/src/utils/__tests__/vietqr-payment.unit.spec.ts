import {
  classifyVietQrObservation,
  maskAccountNumber,
  normalizeVndAmount,
} from "../vietqr-payment"

const base = {
  expected_amount: "500000",
  observed_amount: "500000",
  expected_reference: "VQABC123",
  observed_reference: "DH VQABC123",
  expires_at: "2026-08-06T12:00:00.000Z",
  observed_at: "2026-08-06T11:00:00.000Z",
}

describe("VietQR observation invariants", () => {
  it.each([
    [base, "exact"],
    [{ ...base, observed_amount: "499999" }, "underpaid"],
    [{ ...base, observed_amount: "500001" }, "overpaid"],
    [{ ...base, observed_reference: "DH OTHER" }, "wrong_reference"],
    [{ ...base, observed_at: "2026-08-06T12:00:01.000Z" }, "expired"],
  ])("classifies an observation without force-paid behavior", (input, expected) => {
    expect(classifyVietQrObservation(input)).toBe(expected)
  })

  it("accepts only positive integer VND amounts", () => {
    expect(normalizeVndAmount(1_000_000)).toBe("1000000")
    expect(() => normalizeVndAmount("10.50")).toThrow()
    expect(() => normalizeVndAmount("0")).toThrow()
  })

  it("masks receiver accounts outside payment-session data", () => {
    expect(maskAccountNumber("1234567890")).toBe("******7890")
  })
})
