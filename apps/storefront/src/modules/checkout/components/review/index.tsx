"use client"

import { Heading, Text, clx } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Kiểm tra đơn hàng
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div
            className="mb-6 rounded-md border border-ui-border-base bg-ui-bg-subtle p-4"
            aria-label="Tóm tắt đơn hàng"
            data-testid="review-order-summary"
          >
            <Text className="txt-medium-plus text-ui-fg-base mb-2">
              Tóm tắt đơn hàng
            </Text>
            <dl className="grid grid-cols-2 gap-y-1 text-small-regular">
              <dt className="text-ui-fg-subtle">Sản phẩm</dt>
              <dd className="text-right text-ui-fg-base">
                {cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0}
              </dd>
              <dt className="text-ui-fg-subtle">Tổng cộng</dt>
              <dd className="text-right font-semibold text-ui-fg-base">
                {convertToLocale({
                  amount: cart.total ?? 0,
                  currency_code: cart.currency_code,
                })}
              </dd>
            </dl>
          </div>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Khi bấm Đặt hàng, bạn xác nhận thông tin giao nhận là chính xác
                và đồng ý với điều khoản mua bán, đổi trả và chính sách bảo mật
                của Điện Tử Hưng Phát.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
