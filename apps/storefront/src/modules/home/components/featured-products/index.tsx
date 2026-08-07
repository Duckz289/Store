import { HttpTypes } from "@medusajs/types"
import ProductRail from "@modules/home/components/featured-products/product-rail"

export default async function FeaturedProducts({
  collections,
  region,
  productOverrides,
}: {
  collections: HttpTypes.StoreCollection[]
  region: HttpTypes.StoreRegion
  productOverrides?: Record<string, HttpTypes.StoreProduct[]>
}) {
  return collections.map((collection) => (
    <li key={collection.id}>
      <ProductRail
        collection={collection}
        region={region}
        products={productOverrides?.[collection.id]}
      />
    </li>
  ))
}
