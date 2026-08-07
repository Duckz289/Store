import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { asCatalogProduct } from "types/catalog"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const catalog = asCatalogProduct(product).catalog

  return (
    <div id="product-info">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--hp-muted)]">
        {product.collection ? (
          <LocalizedClientLink href={`/collections/${product.collection.handle}`} className="font-medium hover:text-[var(--hp-accent)]">
            {product.collection.title}
          </LocalizedClientLink>
        ) : null}
        {product.collection && product.categories?.[0] ? <span aria-hidden="true">/</span> : null}
        {product.categories?.[0] ? (
          <LocalizedClientLink href={`/categories/${product.categories[0].handle}`} className="font-medium hover:text-[var(--hp-accent)]">
            {product.categories[0].name}
          </LocalizedClientLink>
        ) : null}
      </div>
      {catalog?.brand || catalog?.model ? (
        <p className="mt-3 text-sm font-semibold text-[var(--hp-accent)]">
          {[catalog.brand?.name, catalog.model].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <h1 className="mt-3 text-[28px] font-bold leading-[1.22] tracking-[-0.02em] text-[var(--hp-ink)] sm:text-[34px]" data-testid="product-title">
        {product.title}
      </h1>
      {product.subtitle ? <p className="mt-3 text-base leading-6 text-[var(--hp-muted)]">{product.subtitle}</p> : null}
      {product.description ? <p className="type-body mt-4 whitespace-pre-line text-[var(--hp-muted)]" data-testid="product-description">{product.description}</p> : null}
    </div>
  )
}

export default ProductInfo
