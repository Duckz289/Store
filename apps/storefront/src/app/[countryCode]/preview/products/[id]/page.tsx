import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveProductPreview } from "@lib/data/product-preview"
import ProductPreviewFrame from "@modules/products/components/product-preview-frame"

export const metadata: Metadata = {
  title: "Product preview",
  robots: { index: false, follow: false, nocache: true },
}

export default async function ProductPreviewPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const [{ id }, { token }] = await Promise.all([
    props.params,
    props.searchParams,
  ])

  if (!token) {
    notFound()
  }

  try {
    await retrieveProductPreview({ id, token })
  } catch {
    notFound()
  }

  return <ProductPreviewFrame token={token} />
}
