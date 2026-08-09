import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SalesProductCard from "@modules/home/components/sales-product-card"

const RecommendedProducts = ({
  products,
}: {
  products: HttpTypes.StoreProduct[]
}) => {
  if (!products.length) {
    return null
  }

  return (
    <section
      className="content-container py-8 sm:py-10"
      aria-labelledby="recommended-products-heading"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="type-badge text-[var(--hp-accent)]">Dành cho bạn</p>
          <h2
            id="recommended-products-heading"
            className="type-section-title mt-2 text-[var(--hp-ink)]"
          >
            Sản phẩm đề xuất
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="text-sm font-semibold text-[var(--hp-accent)] hover:text-[var(--hp-accent-strong)]"
        >
          Xem tất cả
        </LocalizedClientLink>
      </div>
      <ul className="grid grid-cols-1 gap-3 xsmall:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 5).map((product) => (
          <li key={product.id}>
            <SalesProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RecommendedProducts
