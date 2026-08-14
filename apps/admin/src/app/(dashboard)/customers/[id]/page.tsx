"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useParams } from "next/navigation"

import { DetailRow, EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate, formatMoney, maskPhone } from "@/lib/format"
import type { Customer, Order } from "@/lib/types"

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const query = useQuery({ queryKey: ["customer", id], queryFn: async () => { const [customer, orders] = await Promise.all([adminFetch<{ customer: Customer }>(`/admin/customers/${id}?fields=+addresses`), adminFetch<{ orders: Order[] }>(`/admin/orders?customer_id=${id}&limit=100&order=-created_at`)]); return { customer: customer.customer, orders: orders.orders } } })
  if (query.isLoading) return <LoadingState rows={7} />
  if (query.isError || !query.data) return <ErrorState error={query.error} />
  const customer = query.data.customer
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Khách hàng"
  return <div className="stack"><PageHeader eyebrow="Hồ sơ khách hàng" title={name} description={`Tham gia ${formatDate(customer.created_at)}`} /><div className="grid grid-2"><Panel title="Liên hệ"><div className="panel-body detail-list"><DetailRow label="Email">{customer.email ?? "-"}</DetailRow><DetailRow label="Điện thoại">{maskPhone(customer.phone)}</DetailRow><DetailRow label="Địa chỉ">{customer.addresses?.map((address) => [address.address_1, address.city, address.province].filter(Boolean).join(", ")).join("; ") || "-"}</DetailRow></div></Panel><Panel title="Giá trị khách hàng"><div className="panel-body detail-list"><DetailRow label="Số đơn">{query.data.orders.length}</DetailRow><DetailRow label="Tổng chi tiêu">{formatMoney(query.data.orders.reduce((sum, order) => sum + (order.total ?? 0), 0), query.data.orders[0]?.currency_code)}</DetailRow></div></Panel></div><Panel title="Lịch sử đơn hàng">{query.data.orders.length ? <TableWrap><table><thead><tr><th>Đơn</th><th>Tổng</th><th>Thanh toán</th><th>Ngày</th></tr></thead><tbody>{query.data.orders.map((order) => <tr key={order.id}><td><Link className="table-link" href={`/orders/${order.id}`}>#{order.display_id}</Link></td><td>{formatMoney(order.total, order.currency_code)}</td><td><StatusBadge value={order.payment_status} /></td><td>{formatDate(order.created_at)}</td></tr>)}</tbody></table></TableWrap> : <EmptyState title="Chưa có đơn hàng" description="Khách hàng này chưa phát sinh đơn." />}</Panel></div>
}
