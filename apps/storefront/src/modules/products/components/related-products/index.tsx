import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import SalesProductCard from "@modules/home/components/sales-product-card"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({ product, countryCode }: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) return null

  const queryParams: HttpTypes.StoreProductListParams = { is_giftcard: false, limit: 8 }
  if (product.collection_id) queryParams.collection_id = [product.collection_id]
  if (product.tags?.length) queryParams.tag_id = product.tags.map((tag) => tag.id).filter(Boolean) as string[]

  const products = await listProducts({ queryParams, countryCode }).then(({ response }) => response.products.filter((candidate) => candidate.id !== product.id).slice(0, 5))
  if (!products.length) return null

  return (
    <section aria-labelledby="related-products-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="type-badge text-[var(--hp-accent)]">Gợi ý thêm</p>
          <h2 id="related-products-heading" className="type-section-title mt-2">Sản phẩm liên quan</h2>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((relatedProduct) => <li key={relatedProduct.id}><SalesProductCard product={relatedProduct} /></li>)}
      </ul>
    </section>
  )
}
