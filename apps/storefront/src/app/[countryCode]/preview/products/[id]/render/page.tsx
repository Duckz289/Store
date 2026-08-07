import { notFound } from "next/navigation"

import { retrieveProductPreview } from "@lib/data/product-preview"
import { getRegion } from "@lib/data/regions"
import SalesProductCard from "@modules/home/components/sales-product-card"
import ProductTemplate from "@modules/products/templates"

export default async function ProductPreviewRenderPage(props: {
  params: Promise<{ countryCode: string; id: string }>
  searchParams: Promise<{ token?: string; mode?: string }>
}) {
  const [{ countryCode, id }, { token, mode }] = await Promise.all([
    props.params,
    props.searchParams,
  ])

  if (!token) {
    notFound()
  }

  const [response, region] = await Promise.all([
    retrieveProductPreview({ id, token }).catch(() => null),
    getRegion(countryCode),
  ])

  if (!response?.product || !region) {
    notFound()
  }

  if (mode === "card") {
    return (
      <main className="min-h-screen bg-[var(--hp-paper)] p-5">
        <div className="mx-auto max-w-[320px]">
          <SalesProductCard product={response.product} />
        </div>
      </main>
    )
  }

  return (
    <ProductTemplate
      product={response.product}
      region={region}
      countryCode={countryCode}
      images={response.product.images ?? []}
      preview
    />
  )
}
