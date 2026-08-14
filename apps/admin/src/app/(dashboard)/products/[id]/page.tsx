"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { ProductForm } from "@/components/product-form"
import { ErrorState, LoadingState, PageHeader, StatusBadge } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { Product, ProductCatalog } from "@/lib/types"

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const query = useQuery({ queryKey: ["product", id], queryFn: async () => {
    const [core, catalog] = await Promise.all([
      adminFetch<{ product: Product }>(`/admin/products/${id}?fields=+variants.prices,+images`),
      adminFetch<{ catalog: ProductCatalog }>(`/admin/products/${id}/catalog`),
    ])
    return { product: core.product, catalog: catalog.catalog }
  } })
  if (query.isLoading) return <LoadingState rows={8} />
  if (query.isError || !query.data) return <ErrorState error={query.error} />
  return <div className="stack"><PageHeader eyebrow="Chi tiết sản phẩm" title={query.data.product.title} action={<StatusBadge value={query.data.product.status} />} /><ProductForm product={query.data.product} catalog={query.data.catalog} /></div>
}
