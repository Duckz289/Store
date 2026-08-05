import {
  VIETNAM_FREE_SHIPPING_THRESHOLD,
  VIETNAM_STANDARD_SHIPPING_FEE,
  calculateVietnamStandardShippingFee,
} from "../vietnam-shipping"

describe("Vietnam standard shipping policy", () => {
  it("charges the standard fee below the free-shipping threshold", () => {
    expect(
      calculateVietnamStandardShippingFee(
        VIETNAM_FREE_SHIPPING_THRESHOLD - 1
      )
    ).toBe(VIETNAM_STANDARD_SHIPPING_FEE)
  })

  it("is free at and above the threshold", () => {
    expect(
      calculateVietnamStandardShippingFee(VIETNAM_FREE_SHIPPING_THRESHOLD)
    ).toBe(0)
    expect(
      calculateVietnamStandardShippingFee(
        VIETNAM_FREE_SHIPPING_THRESHOLD + 1
      )
    ).toBe(0)
  })
})
