import { getProductPrice } from "@lib/util/get-product-price"
import { getProductImage } from "@lib/util/product-image"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { asCatalogProduct } from "types/catalog"

const SalesProductCard = ({ product }: { product: HttpTypes.StoreProduct }) => {
  const { cheapestPrice } = getProductPrice({ product })
  const image = getProductImage(product)
  const catalog = asCatalogProduct(product).catalog
  const stock = product.variants?.reduce(
    (total, variant) => total + Math.max(0, variant.inventory_quantity || 0),
    0
  )
  const specification =
    [catalog?.brand?.name, catalog?.model].filter(Boolean).join(" · ") ||
    product.subtitle ||
    product.variants?.[0]?.title ||
    "Thông tin cấu hình được cập nhật theo phiên bản"
  const hasDiscount =
    cheapestPrice?.price_type === "sale" &&
    Number(cheapestPrice.percentage_diff) > 0

  return (
    <article className="flex h-full min-h-[440px] flex-col overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-4 transition-colors hover:border-[var(--hp-accent)]">
      <LocalizedClientLink
        href={`/products/${product.handle}`}
        className="group relative block aspect-[4/3] isolate overflow-hidden rounded-[10px] border border-white/80 bg-[#f1f2f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
      >
        {hasDiscount && (
          <span className="type-badge absolute left-2 top-2 z-10 rounded-[6px] bg-[var(--hp-accent)] px-2 py-1 text-white">
            Giảm {cheapestPrice.percentage_diff}%
          </span>
        )}
        {image ? (
          <Image
            src={image}
            alt={catalog?.media_alt_text?.[image] || product.title}
            fill
            sizes="(max-width: 640px) 78vw, (max-width: 1280px) 33vw, 280px"
            className="object-contain p-1.5 mix-blend-darken transition-transform duration-200 ease-out group-hover:scale-[1.055] motion-reduce:transition-none"
          />
        ) : (
          // No invented product photography: show the brand's own logo instead, so
          // the card still reads as the right product while staff upload the real shot.
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
            {catalog?.brand?.logo_url ? (
              <Image
                src={catalog.brand.logo_url}
                alt=""
                aria-hidden="true"
                width={96}
                height={40}
                unoptimized
                className="h-10 w-24 object-contain opacity-80"
              />
            ) : null}
            <span className="text-xs text-[var(--hp-muted)]">Đang cập nhật ảnh</span>
          </div>
        )}
      </LocalizedClientLink>

      <div className="flex flex-1 flex-col pt-4">
        <LocalizedClientLink href={`/products/${product.handle}`}>
          <h3 className="type-product-title line-clamp-2 min-h-[2.7em] text-[var(--hp-ink)] hover:text-[var(--hp-accent)]">
            {product.title}
          </h3>
        </LocalizedClientLink>
        <p className="type-product-spec mt-2 line-clamp-2 min-h-[2.9em] text-[var(--hp-muted)]">
          {specification}
        </p>

        <div className="mt-4">
          {cheapestPrice ? (
            <>
              <p className="type-product-price">{cheapestPrice.calculated_price}</p>
              <div className="mt-1 min-h-5">
                {hasDiscount && (
                  <span className="type-old-price line-through">
                    {cheapestPrice.original_price}
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="type-product-price">Liên hệ</p>
          )}
        </div>

        <p className="mt-2 mb-3 min-h-5 text-[13px] font-semibold leading-5 text-[var(--hp-success)]">
          {stock ? `Còn ${stock} sản phẩm` : "Sẵn sàng đặt hàng"}
        </p>

        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="mt-auto inline-flex h-10 items-center justify-center whitespace-nowrap rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-2 text-[13px] font-semibold text-white transition-colors hover:bg-[var(--hp-accent-strong)] sm:px-4 sm:text-sm"
        >
          Xem sản phẩm
        </LocalizedClientLink>
      </div>
    </article>
  )
}

export default SalesProductCard
