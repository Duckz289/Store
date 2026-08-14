"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { PromotionForm } from "@/components/promotion-form"
import {
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { Promotion } from "@/lib/types"

export default function PromotionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const query = useQuery({
    queryKey: ["promotion", id],
    queryFn: () =>
      adminFetch<{ promotion: Promotion }>(
        `/admin/promotions/${id}?fields=+campaign.*`,
      ),
  })
  if (query.isLoading) return <LoadingState />
  if (query.isError || !query.data) return <ErrorState error={query.error} />
  return (
    <div className="stack">
      <PageHeader
        eyebrow="Chi tiết khuyến mãi"
        title={query.data.promotion.code || "Chương trình sale"}
        action={<StatusBadge value={query.data.promotion.status} />}
      />
      <PromotionForm promotion={query.data.promotion} />
    </div>
  )
}
