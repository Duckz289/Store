import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import DealCountdown from "../deal-countdown"
import SalesProductCard from "../sales-product-card"

const FlashDeal = ({ products }: { products: HttpTypes.StoreProduct[] }) => {
  if (!products.length) {
    return null
  }

  return (
    <section className="content-container py-8 sm:py-10" aria-labelledby="flash-deal-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 id="flash-deal-heading" className="type-section-title text-[var(--hp-ink)]">
            Flash deal hôm nay
          </h2>
          <DealCountdown />
        </div>
        <LocalizedClientLink
          href="/store"
          className="text-sm font-semibold text-[var(--hp-accent)] hover:text-[var(--hp-accent-strong)]"
        >
          Xem tất cả
        </LocalizedClientLink>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 5).map((product) => (
          <li key={product.id} className="w-[78vw] max-w-[290px] shrink-0 snap-start sm:w-auto sm:max-w-none">
            <SalesProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default FlashDeal
