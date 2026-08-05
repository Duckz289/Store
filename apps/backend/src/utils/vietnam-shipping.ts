export const VIETNAM_FREE_SHIPPING_THRESHOLD = 1_000_000
export const VIETNAM_STANDARD_SHIPPING_FEE = 30_000

export function calculateVietnamStandardShippingFee(itemTotal: number) {
  return itemTotal >= VIETNAM_FREE_SHIPPING_THRESHOLD
    ? 0
    : VIETNAM_STANDARD_SHIPPING_FEE
}
