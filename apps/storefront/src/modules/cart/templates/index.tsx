import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-8 lg:py-10">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 gap-y-6 small:grid-cols-[minmax(0,1fr)_360px] small:gap-x-8 large:gap-x-12">
            <div className="flex min-w-0 flex-col gap-y-5 rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-white p-5 sm:p-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="sticky top-8 flex flex-col gap-y-8">
                {cart && cart.region && (
                  <>
                    <div className="rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-white p-5 sm:p-6">
                      <Summary cart={cart} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
