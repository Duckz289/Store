import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import CategoryShortcuts from "@modules/home/components/category-shortcuts"
import FlashDeal from "@modules/home/components/flash-deal"
import RecommendedProducts from "@modules/home/components/recommended-products"
import TrustBar from "@modules/home/components/trust-bar"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"

export const metadata: Metadata = {
  title: "Điện Tử Hưng Phát",
  description:
    "Cửa hàng điện tử chính hãng, giá minh bạch và giao hàng toàn quốc.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  const flashDealCollection = collections.find(
    (collection) => collection.handle === "flash-deal"
  )
  const [categories, productResult, flashDealResult] =
    await Promise.all([
      listCategories().catch(() => []),
      listProducts({
        regionId: region?.id,
        queryParams: {
          limit: 10,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.inventory_items.inventory.location_levels,*images,+thumbnail,+subtitle",
        },
      }).catch(() => ({ response: { products: [], count: 0 }, nextPage: null })),
      flashDealCollection
        ? listProducts({
            regionId: region?.id,
            queryParams: {
              limit: 5,
              collection_id: [flashDealCollection.id],
              fields:
                "*variants.calculated_price,+variants.inventory_quantity,*variants.inventory_items.inventory.location_levels,*images,+thumbnail,+subtitle",
            },
          }).catch(() => ({ response: { products: [], count: 0 }, nextPage: null }))
        : Promise.resolve({ response: { products: [], count: 0 }, nextPage: null }),
    ])

  if (!collections || !region) {
    return null
  }

  const recommendedProducts = productResult.response.products.length
    ? productResult.response.products
    : flashDealResult.response.products

  return (
    <>
      <Hero
        categories={categories}
        products={productResult.response.products}
        promotionalProducts={flashDealResult.response.products}
      />
      <CategoryShortcuts categories={categories} />
      <FlashDeal products={flashDealResult.response.products} />
      <TrustBar />
      <RecommendedProducts products={recommendedProducts} />
      <section
        id="repair"
        className="content-container pb-16 pt-4 sm:pb-24"
        aria-labelledby="repair-heading"
      >
        <div className="grid gap-6 rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-paper)] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="type-badge text-[var(--hp-accent)]">
              Hỗ trợ sau mua
            </p>
            <h2 id="repair-heading" className="type-section-title mt-2 text-[var(--hp-ink)]">
              Thiết bị cần kiểm tra? Bắt đầu một hồ sơ sửa chữa rõ ràng.
            </h2>
            <p className="type-body mt-3 max-w-2xl text-[var(--hp-muted)]">
              Ghi nhận tình trạng, theo dõi chẩn đoán và xem báo giá theo từng
              bước. Hồ sơ sửa chữa độc lập với đơn mua hàng.
            </p>
          </div>
          <LocalizedClientLink
            href="/repair"
            className="inline-flex h-11 items-center justify-center rounded-[var(--hp-radius-control)] bg-[var(--hp-ink)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--hp-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"
          >
            Xem dịch vụ sửa chữa
          </LocalizedClientLink>
        </div>
      </section>
    </>
  )
}
