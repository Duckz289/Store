import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import Hero from "@modules/home/components/hero"
import CategoryShortcuts from "@modules/home/components/category-shortcuts"
import TrustBar from "@modules/home/components/trust-bar"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

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

  const [{ collections }, categories] = await Promise.all([
    listCollections({
      fields: "id, handle, title",
    }),
    listCategories().catch(() => []),
  ])

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <CategoryShortcuts categories={categories} />
      <TrustBar />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
      <section
        id="repair"
        className="content-container pb-16 pt-4 sm:pb-24"
        aria-labelledby="repair-heading"
      >
        <div className="grid gap-6 rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-paper)] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hp-accent)]">
              Hỗ trợ sau mua
            </p>
            <h2 id="repair-heading" className="mt-2 text-2xl font-bold text-[var(--hp-ink)]">
              Thiết bị cần kiểm tra? Bắt đầu một hồ sơ sửa chữa rõ ràng.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--hp-muted)]">
              Ghi nhận tình trạng, theo dõi chẩn đoán và xem báo giá theo từng
              bước. Hồ sơ sửa chữa độc lập với đơn mua hàng.
            </p>
          </div>
          <LocalizedClientLink
            href="/repair"
            className="inline-flex h-11 items-center justify-center rounded-[var(--hp-radius-control)] bg-[var(--hp-ink)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--hp-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"
          >
            Xem dịch vụ sửa chữa
          </LocalizedClientLink>
        </div>
      </section>
    </>
  )
}
