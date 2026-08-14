import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Input, Table } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { FormEvent, useState } from "react"

import { sdk } from "../../../lib/sdk"
import { EmptyState, ErrorState, LoadingState, NativeLink, PageContainer, PageHeader, StatusBadge, formatDate, formatMoney } from "../shared"

type Order = { id: string; display_id?: number; email?: string; total?: number; currency_code?: string; created_at?: string; payment_status?: string; fulfillment_status?: string; customer?: { first_name?: string; last_name?: string; email?: string } }
type OrderResponse = { orders: Order[]; count: number }

const OrdersOperationsPage = () => {
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const orders = useQuery({ queryKey: ["operations-orders", query], queryFn: () => sdk.client.fetch<OrderResponse>(`/admin/orders?limit=50&order=-created_at${query ? `&q=${encodeURIComponent(query)}` : ""}`) })
  const submit = (event: FormEvent) => { event.preventDefault(); setQuery(search.trim()) }

  return <PageContainer>
    <PageHeader title="Đơn hàng" description="Theo dõi đơn hàng từ Order Module. Chi tiết và thao tác thanh toán/fulfillment mở trong trang chuẩn, nơi Medusa kiểm tra trạng thái trước khi cho phép hành động." />
    <form className="flex gap-2 border-b px-6 py-4" onSubmit={submit}><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, email hoặc khách hàng" aria-label="Tìm đơn hàng" /><Button type="submit" variant="secondary">Tìm</Button></form>
    {orders.isLoading ? <LoadingState /> : null}{orders.error ? <ErrorState error={orders.error} /> : null}
    {orders.data && !orders.data.orders.length ? <EmptyState title="Không có đơn hàng phù hợp" description="Thử thay đổi từ khóa tìm kiếm." /> : null}
    {orders.data?.orders.length ? <div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.HeaderCell>Mã đơn</Table.HeaderCell><Table.HeaderCell>Khách hàng</Table.HeaderCell><Table.HeaderCell>Thanh toán</Table.HeaderCell><Table.HeaderCell>Tổng tiền</Table.HeaderCell><Table.HeaderCell>Fulfillment</Table.HeaderCell><Table.HeaderCell>Ngày tạo</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{orders.data.orders.map((order) => <Table.Row key={order.id}><Table.Cell><NativeLink to={`/orders/${order.id}`}>#{order.display_id ?? order.id.slice(-8)}</NativeLink></Table.Cell><Table.Cell>{[order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ") || order.email || order.customer?.email || "-"}</Table.Cell><Table.Cell><StatusBadge value={order.payment_status} /></Table.Cell><Table.Cell>{formatMoney(order.total, order.currency_code)}</Table.Cell><Table.Cell><StatusBadge value={order.fulfillment_status} /></Table.Cell><Table.Cell>{formatDate(order.created_at)}</Table.Cell></Table.Row>)}</Table.Body></Table></div> : null}
  </PageContainer>
}

export const config = defineRouteConfig({ label: "Đơn hàng", rank: 7 })
export default OrdersOperationsPage
