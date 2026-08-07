import { getProductPrice } from "@lib/util/get-product-price"
import { getProductImage } from "@lib/util/product-image"
import {
  Camera,
  Clock,
  ComputerDesktop,
  LaptopMobile,
  Phone,
  ShoppingBag,
  SquaresPlus,
  Tools,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

const categoryIcons = [
  Phone,
  LaptopMobile,
  Camera,
  Clock,
  ShoppingBag,
  ComputerDesktop,
  Tools,
  SquaresPlus,
]

const ProductVisual = ({
  product,
  sizes,
}: {
  product?: HttpTypes.StoreProduct
  sizes: string
}) => {
  const image = getProductImage(product)

  return image ? (
    <Image
      src={image}
      alt={product?.title || "Sản phẩm điện tử"}
      fill
      priority
      sizes={sizes}
      className="object-contain object-center"
    />
  ) : (
    <div className="flex h-full items-center justify-center text-[var(--hp-muted)]">
      <ShoppingBag className="h-20 w-20" />
    </div>
  )
}

const PromoTile = ({ product }: { product?: HttpTypes.StoreProduct }) => {
  if (!product) {
    return null
  }

  const { cheapestPrice } = getProductPrice({ product })

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group grid min-h-[158px] grid-cols-[1fr_42%] overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 transition-colors hover:border-[var(--hp-accent)]"
    >
      <div className="relative z-10 flex min-w-0 flex-col justify-between">
        <div>
          <p className="type-badge text-[var(--hp-accent)]">Ưu đãi nổi bật</p>
          <h2 className="mt-2 line-clamp-2 text-base font-semibold leading-[1.35] text-[var(--hp-ink)]">
            {product.title}
          </h2>
        </div>
        <div>
          {cheapestPrice && (
            <p className="mt-3 text-lg font-bold leading-tight tabular-nums text-[var(--hp-ink)]">
              {cheapestPrice.calculated_price}
            </p>
          )}
          <span className="mt-2 inline-flex text-[13px] font-semibold text-[var(--hp-accent)]">
            Xem ngay
          </span>
        </div>
      </div>
      <div className="relative min-h-[120px] transition-transform duration-200 group-hover:scale-[1.02]">
        <ProductVisual product={product} sizes="240px" />
      </div>
    </LocalizedClientLink>
  )
}

const Hero = ({
  categories,
  products,
  promotionalProducts,
}: {
  categories: HttpTypes.StoreProductCategory[]
  products: HttpTypes.StoreProduct[]
  promotionalProducts: HttpTypes.StoreProduct[]
}) => {
  const topCategories = categories
    .filter((category) => !category.parent_category)
    .slice(0, 8)
  const heroProducts = promotionalProducts.length ? promotionalProducts : products
  const mainProduct = heroProducts[0]
  const laptopProduct = heroProducts[1]
  const accessoryProduct = heroProducts[2]
  const mainPrice = mainProduct
    ? getProductPrice({ product: mainProduct }).cheapestPrice
    : null

  return (
    <section className="bg-[var(--hp-paper)] py-3 sm:py-4" aria-label="Ưu đãi và danh mục nổi bật">
      <div className="content-container grid gap-3 xl:grid-cols-[232px_minmax(0,1fr)_340px]">
        <aside className="hidden overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] xl:block">
          <h2 className="border-b border-[var(--hp-line)] px-4 py-3 text-sm font-semibold text-[var(--hp-ink)]">
            Danh mục sản phẩm
          </h2>
          <ul className="py-1">
            {topCategories.map((category, index) => {
              const Icon = categoryIcons[index % categoryIcons.length]

              return (
                <li key={category.id}>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="group flex min-h-10 items-center gap-3 px-4 py-2 text-[14px] font-medium leading-5 text-[var(--hp-ink)] hover:bg-[var(--hp-accent-soft)] hover:text-[var(--hp-accent)]"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-[var(--hp-muted)] group-hover:text-[var(--hp-accent)]" />
                    <span className="line-clamp-1">{category.name}</span>
                  </LocalizedClientLink>
                </li>
              )
            })}
          </ul>
        </aside>

        <LocalizedClientLink
          href={mainProduct ? `/products/${mainProduct.handle}` : "/store"}
          className="group grid min-h-[330px] overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] sm:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)]"
        >
          <div className="relative z-10 flex flex-col justify-center p-6 sm:p-8 lg:p-9">
            <p className="type-badge text-[var(--hp-accent)]">Ưu đãi cuối tuần</p>
            <h1 className="type-hero-title mt-3 max-w-[620px] text-[var(--hp-ink)]">
              Thiết bị chính hãng, giá rõ ràng
            </h1>
            <p className="type-body mt-3 text-[var(--hp-muted)]">
              Giao nhanh, hỗ trợ tận tâm
            </p>
            {mainPrice && (
              <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="type-product-price text-[var(--hp-accent)]">
                  {mainPrice.calculated_price}
                </span>
                {mainPrice.price_type === "sale" && (
                  <span className="type-old-price line-through">
                    {mainPrice.original_price}
                  </span>
                )}
              </div>
            )}
            <span className="mt-5 inline-flex h-11 w-fit items-center justify-center rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-5 text-sm font-semibold text-white transition-colors group-hover:bg-[var(--hp-accent-strong)]">
              Mua ngay
            </span>
          </div>
          <div className="relative min-h-[260px] p-5 sm:min-h-[330px]">
            <ProductVisual product={mainProduct} sizes="(max-width: 1024px) 50vw, 580px" />
          </div>
        </LocalizedClientLink>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <PromoTile product={laptopProduct || products[1]} />
          <PromoTile product={accessoryProduct || products[2]} />
        </div>
      </div>
    </section>
  )
}

export default Hero
