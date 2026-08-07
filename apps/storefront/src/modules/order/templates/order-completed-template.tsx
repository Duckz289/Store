import { Heading } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"
import { retrieveCustomer } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const customer = await retrieveCustomer()

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col justify-center items-center gap-y-10 max-w-4xl h-full w-full">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex flex-col gap-4 max-w-4xl h-full bg-white w-full py-10"
          data-testid="order-complete-container"
        >
          <Heading
            level="h1"
            className="flex flex-col gap-y-3 text-ui-fg-base text-3xl mb-4"
          >
            <span>Cảm ơn bạn!</span>
            <span>Đơn hàng đã được ghi nhận.</span>
          </Heading>
          <OrderDetails order={order} showStatus />
          <div
            className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4"
            role="status"
            aria-live="polite"
            data-testid="order-next-steps"
          >
            {["captured", "authorized", "paid"].includes(String(order.payment_status)) ? (
              <p>Thanh toán đã được xác nhận. Chúng tôi sẽ cập nhật trạng thái giao hàng khi đơn được xử lý.</p>
            ) : (
              <p>Đơn hàng đang chờ xác nhận thanh toán hoặc xử lý giao hàng. Không cần tạo tài khoản để tiếp tục theo dõi đơn khách.</p>
            )}
            {customer && (
              <LocalizedClientLink
                href={`/account/orders/details/${order.id}`}
                className="mt-3 inline-flex text-ui-fg-interactive underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-interactive"
              >
                Xem chi tiết trong tài khoản
              </LocalizedClientLink>
            )}
          </div>
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items order={order} />
          <CartTotals totals={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
