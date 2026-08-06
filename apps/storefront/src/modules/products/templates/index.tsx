import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate = ({ product, region, countryCode, images }: ProductTemplateProps) => {
  if (!product?.id) notFound()

  return (
    <>
      <div className="content-container py-5 lg:py-8" data-testid="product-container">
        <nav className="mb-5 flex items-center gap-2 text-sm text-[var(--hp-muted)]" aria-label="Điều hướng sản phẩm">
          <LocalizedClientLink href="/store" className="hover:text-[var(--hp-accent)]">Sản phẩm</LocalizedClientLink>
          <span aria-hidden="true">/</span>
          <span className="line-clamp-1 text-[var(--hp-ink)]">{product.title}</span>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)] lg:gap-10">
          <ImageGallery product={product} images={images} />
          <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <ProductInfo product={product} />
            <ProductActionsWrapper id={product.id} region={region} />
            <ProductTabs product={product} />
          </div>
        </div>
      </div>
      <div className="content-container py-10 lg:py-16" data-testid="related-products-container">
        <Suspense fallback={null}><RelatedProducts product={product} countryCode={countryCode} /></Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
