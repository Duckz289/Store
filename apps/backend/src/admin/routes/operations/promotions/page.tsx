import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import { sdk } from "../../../lib/sdk"
import { EmptyState, ErrorState, LoadingState, NativeLink, PageContainer, PageHeader, StatusBadge, formatDate } from "../shared"

type Promotion = {
  id: string
  code?: string | null
  campaign?: { name?: string | null }
  type?: string
  status?: string
  application_method?: { type?: string; value?: number; currency_code?: string | null }
  starts_at?: string | null
  ends_at?: string | null
}
type PromotionResponse = { promotions: Promotion[]; count: number }

const PromotionsOperationsPage = () => {
  const promotions = useQuery({ queryKey: ["operations-promotions"], queryFn: () => sdk.client.fetch<PromotionResponse>("/admin/promotions?limit=100") })

  return <PageContainer>
    <PageHeader title="Khuyến mãi và coupon" description="Danh sách dùng Promotion Module gốc của Medusa. Giá trị giảm, điều kiện áp dụng và stacking luôn do backend quyết định." action={<Button size="small" asChild><Link to="/promotions/create">Tạo khuyến mãi</Link></Button>} />
    {promotions.isLoading ? <LoadingState /> : null}{promotions.error ? <ErrorState error={promotions.error} /> : null}
    {promotions.data && !promotions.data.promotions.length ? <EmptyState title="Chưa có khuyến mãi" description="Tạo khuyến mãi bằng Promotion Module của Medusa." href="/promotions/create" action="Tạo khuyến mãi" /> : null}
    {promotions.data?.promotions.length ? <div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.HeaderCell>Tên / mã</Table.HeaderCell><Table.HeaderCell>Loại</Table.HeaderCell><Table.HeaderCell>Giá trị</Table.HeaderCell><Table.HeaderCell>Thời gian</Table.HeaderCell><Table.HeaderCell>Trạng thái</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{promotions.data.promotions.map((promotion) => <Table.Row key={promotion.id}><Table.Cell><NativeLink to={`/promotions/${promotion.id}`}>{promotion.campaign?.name || promotion.code || promotion.id.slice(-8)}</NativeLink>{promotion.code ? <Text size="xsmall" className="text-ui-fg-subtle">{promotion.code}</Text> : null}</Table.Cell><Table.Cell>{promotion.application_method?.type || promotion.type || "-"}</Table.Cell><Table.Cell>{promotion.application_method?.value ?? "-"}{promotion.application_method?.type === "percentage" ? "%" : ""}</Table.Cell><Table.Cell><div>{formatDate(promotion.starts_at)}</div><Text size="xsmall" className="text-ui-fg-subtle">đến {formatDate(promotion.ends_at)}</Text></Table.Cell><Table.Cell><StatusBadge value={promotion.status} /></Table.Cell></Table.Row>)}</Table.Body></Table></div> : null}
  </PageContainer>
}

export const config = defineRouteConfig({ label: "Khuyến mãi", rank: 8 })
export default PromotionsOperationsPage
