"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch, queryString } from "@/lib/api"
import { formatDate, formatMoney } from "@/lib/format"
import type { Order } from "@/lib/types"

const stages = [
  ["", "Tất cả"], ["not_fulfilled", "Đơn mới"], ["partially_fulfilled", "Đang xử lý"],
  ["fulfilled", "Đang giao / đã giao"], ["canceled", "Đã hủy"],
]

export default function OrdersPage() {
  const [search, setSearch] = useState("")
  const [stage, setStage] = useState("")
  const query = useQuery({ queryKey: ["orders", search, stage], queryFn: () => adminFetch<{ orders: Order[]; count: number }>(`/admin/orders${queryString({ q: search || undefined, fulfillment_status: stage || undefined, limit: 100, order: "-created_at", fields: "+items,+customer" })}`) })
  return <div className="stack"><PageHeader eyebrow="Bán hàng" title="Đơn hàng" description="Theo dõi đơn mới, đang xử lý, đang giao, hoàn tất và hủy." /><Panel>
    <div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, email khách hàng" /><select value={stage} onChange={(event) => setStage(event.target.value)}>{stages.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><span className="toolbar-spacer">{query.data?.count ?? 0} đơn</span></div>
    {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState error={query.error} /> : query.data?.orders.length ? <TableWrap><table><thead><tr><th>Đơn</th><th>Khách hàng</th><th>Tổng</th><th>Thanh toán</th><th>Giao hàng</th><th>Ngày tạo</th></tr></thead><tbody>{query.data.orders.map((order) => <tr key={order.id}><td><Link className="table-link" href={`/orders/${order.id}`}>#{order.display_id ?? order.id.slice(-6)}</Link></td><td>{order.customer ? `${order.customer.first_name ?? ""} ${order.customer.last_name ?? ""}`.trim() || order.email : order.email ?? "-"}</td><td>{formatMoney(order.total, order.currency_code)}</td><td><StatusBadge value={order.payment_status} /></td><td><StatusBadge value={order.fulfillment_status} /></td><td>{formatDate(order.created_at)}</td></tr>)}</tbody></table></TableWrap> : <EmptyState title="Không có đơn phù hợp" description="Thử thay đổi bộ lọc hoặc từ khóa." />}
  </Panel></div>
}
