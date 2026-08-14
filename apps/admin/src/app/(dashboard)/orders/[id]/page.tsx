"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { DetailRow, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate, formatMoney } from "@/lib/format"
import type { Order, RepairCase } from "@/lib/types"

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const query = useQuery({ queryKey: ["order", id], queryFn: async () => {
    const [order, repairs] = await Promise.all([
      adminFetch<{ order: Order }>(`/admin/orders/${id}?fields=+items,+items.variant,+customer,+shipping_address,+billing_address`),
      adminFetch<{ repair_cases: RepairCase[] }>(`/admin/orders/${id}/repairs`),
    ])
    return { order: order.order, repairs: repairs.repair_cases }
  } })
  if (query.isLoading) return <LoadingState rows={8} />
  if (query.isError || !query.data) return <ErrorState error={query.error} />
  const order = query.data.order
  return <div className="stack"><PageHeader eyebrow="Chi tiết đơn hàng" title={`Đơn #${order.display_id ?? order.id.slice(-6)}`} description={`Tạo lúc ${formatDate(order.created_at)}`} action={<><StatusBadge value={order.payment_status} /><StatusBadge value={order.fulfillment_status} /></>} />
    <div className="grid layout-wide"><Panel title="Sản phẩm"><TableWrap><table><thead><tr><th>Sản phẩm</th><th>SKU</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{order.items?.map((item) => <tr key={item.id}><td>{item.title}<span className="table-subtitle">{item.variant_title}</span></td><td>{item.variant?.sku ?? "-"}</td><td>{item.quantity}</td><td>{formatMoney(item.unit_price, order.currency_code)}</td><td>{formatMoney(item.total ?? (item.unit_price ?? 0) * item.quantity, order.currency_code)}</td></tr>)}</tbody></table></TableWrap></Panel>
      <Panel title="Tổng thanh toán"><div className="panel-body detail-list"><DetailRow label="Tạm tính">{formatMoney(order.subtotal, order.currency_code)}</DetailRow><DetailRow label="Vận chuyển">{formatMoney(order.shipping_total, order.currency_code)}</DetailRow><DetailRow label="Giảm giá">-{formatMoney(order.discount_total, order.currency_code)}</DetailRow><DetailRow label="Thuế">{formatMoney(order.tax_total, order.currency_code)}</DetailRow><DetailRow label="Tổng">{formatMoney(order.total, order.currency_code)}</DetailRow></div></Panel>
    </div>
    <div className="grid grid-2"><Panel title="Khách hàng"><div className="panel-body detail-list"><DetailRow label="Email">{order.email ?? "-"}</DetailRow><DetailRow label="Người nhận">{[order.shipping_address?.first_name, order.shipping_address?.last_name].filter(Boolean).join(" ") || "-"}</DetailRow><DetailRow label="Điện thoại">{order.shipping_address?.phone ?? "-"}</DetailRow><DetailRow label="Địa chỉ">{[order.shipping_address?.address_1, order.shipping_address?.city, order.shipping_address?.province].filter(Boolean).join(", ") || "-"}</DetailRow></div></Panel><Panel title="Ca sửa chữa liên quan"><div className="panel-body stack-small">{query.data.repairs.length ? query.data.repairs.map((repair) => <a className="repair-brief" href={`/admin/repairs/${repair.id}`} key={repair.id}><strong>{repair.code}</strong><StatusBadge value={repair.status} /></a>) : <span className="page-description">Chưa có ca sửa chữa cho đơn này.</span>}</div></Panel></div>
  </div>
}
