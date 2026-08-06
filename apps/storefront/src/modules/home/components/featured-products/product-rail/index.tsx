import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import InteractiveLink from "@modules/common/components/interactive-link"
import SalesProductCard from "@modules/home/components/sales-product-card"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts?.length) {
    return null
  }

  return (
    <div className="content-container py-8 sm:py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="type-badge text-[var(--hp-accent)]">Gợi ý theo ngành hàng</p>
          <h2 className="type-section-title mt-2 text-[var(--hp-ink)]">
            {collection.title}
          </h2>
        </div>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          Xem tất cả
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-1 gap-3 xsmall:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {pricedProducts &&
          pricedProducts.slice(0, 5).map((product) => (
            <li key={product.id}>
              <SalesProductCard product={product} />
            </li>
          ))}
      </ul>
    </div>
  )
}
