import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({ product, variantId: variant?.id })
  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="h-12 w-40 animate-pulse rounded-[8px] bg-[var(--hp-paper)]" aria-label="Đang tải giá" />
  }

  const isSale = selectedPrice.price_type === "sale"

  return (
    <div className="border-y border-[var(--hp-line)] py-4 text-[var(--hp-ink)]">
      <p className="text-[13px] font-medium text-[var(--hp-muted)]">{variant ? "Giá phiên bản đã chọn" : "Giá từ"}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`type-product-price ${isSale ? "text-[var(--hp-accent)]" : ""}`} data-testid="product-price" data-value={selectedPrice.calculated_price_number}>
          {selectedPrice.calculated_price}
        </span>
        {isSale && <span className="type-old-price line-through" data-testid="original-product-price" data-value={selectedPrice.original_price_number}>{selectedPrice.original_price}</span>}
        {isSale && <span className="type-badge rounded-[6px] bg-[var(--hp-accent-soft)] px-2 py-1 text-[var(--hp-accent)]">Giảm {selectedPrice.percentage_diff}%</span>}
      </div>
    </div>
  )
}
