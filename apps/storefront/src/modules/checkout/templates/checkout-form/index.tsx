import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id, "no-store")
  const paymentMethods = await listCartPaymentMethods(
    cart.region?.id ?? "",
    "no-store"
  )

  if (!shippingMethods || !paymentMethods) {
    return (
      <div
        className="rounded-md border border-ui-border-base bg-ui-bg-subtle p-4 text-ui-fg-base"
        role="alert"
        aria-live="assertive"
        data-testid="checkout-options-error"
      >
        Không thể tải phương thức vận chuyển hoặc thanh toán. Vui lòng tải lại
        trang để thử lại.
      </div>
    )
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods} />

      <Review cart={cart} />
    </div>
  )
}
