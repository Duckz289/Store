"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate, formatMoney } from "@/lib/format"
import type { InventoryItem, Order, Product, RepairCase } from "@/lib/types"

type DashboardData = {
  orders: Order[]
  orderCount: number
  products: Product[]
  inventory: InventoryItem[]
  repairs: RepairCase[]
}

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const [orders, products, inventory, repairs] = await Promise.all([
        adminFetch<{ orders: Order[]; count: number }>(`/admin/orders?limit=100&order=-created_at&created_at%5B%24gte%5D=${encodeURIComponent(today.toISOString())}`),
        adminFetch<{ products: Product[]; count: number }>("/admin/products?limit=5&order=-created_at"),
        adminFetch<{ inventory_items: InventoryItem[] }>("/admin/inventory-items?limit=100&fields=id,sku,title,*location_levels"),
        adminFetch<{ repair_cases: RepairCase[] }>("/admin/repairs?limit=100"),
      ])
      return {
        orders: orders.orders,
        orderCount: orders.count,
        products: products.products,
        inventory: inventory.inventory_items,
        repairs: repairs.repair_cases,
      }
    },
  })

  if (query.isLoading) return <><PageHeader title="Tổng quan vận hành" /><LoadingState rows={8} /></>
  if (query.isError || !query.data) return <><PageHeader title="Tổng quan vận hành" /><ErrorState error={query.error} /></>

  const data = query.data
  const revenue = data.orders.reduce((sum, order) => sum + (order.total ?? 0), 0)
  const currency = data.orders[0]?.currency_code ?? "vnd"
  const restock = data.inventory.filter((item) => {
    const available = item.location_levels?.reduce((sum, level) => sum + (level.available_quantity ?? 0), 0) ?? 0
    return available <= 0
  })
  const activeRepairs = data.repairs.filter((repair) => !["returned", "closed", "canceled"].includes(repair.status))

  return (
    <div className="stack">
      <PageHeader eyebrow="Hôm nay" title="Tổng quan vận hành" description="Các số liệu được tổng hợp trực tiếp từ Medusa và module sửa chữa." />
      <div className="grid grid-4">
        <Metric label="Doanh thu hôm nay" value={formatMoney(revenue, currency)} note={`${data.orders.length} đơn phát sinh`} accent />
        <Metric label="Đơn mới" value={String(data.orderCount)} note="Tính từ 00:00 hôm nay" />
        <Metric label="SKU cần nhập" value={String(restock.length)} note="Tồn khả dụng bằng 0" />
        <Metric label="Repair cần xử lý" value={String(activeRepairs.length)} note="Chưa hoàn tất hoặc hủy" />
      </div>
      <div className="grid layout-wide">
        <Panel title="Đơn hàng mới" description="Tối đa 8 đơn gần nhất" action={<Link className="text-button" href="/orders">Xem tất cả</Link>}>
          {data.orders.length ? <TableWrap><table><thead><tr><th>Đơn</th><th>Khách hàng</th><th>Tổng</th><th>Trạng thái</th><th>Thời gian</th></tr></thead><tbody>
            {data.orders.slice(0, 8).map((order) => <tr key={order.id}><td><Link className="table-link" href={`/orders/${order.id}`}>#{order.display_id ?? order.id.slice(-6)}</Link></td><td>{order.email ?? "-"}</td><td>{formatMoney(order.total, order.currency_code)}</td><td><StatusBadge value={order.fulfillment_status ?? order.status} /></td><td>{formatDate(order.created_at)}</td></tr>)}
          </tbody></table></TableWrap> : <EmptyState title="Chưa có đơn hôm nay" description="Đơn mới sẽ xuất hiện tại đây." />}
        </Panel>
        <Panel title="Sửa chữa ưu tiên" description="Các ca đang mở gần nhất">
          <div className="panel-body stack-small">
            {activeRepairs.slice(0, 6).map((repair) => <Link className="repair-brief" href={`/repairs/${repair.id}`} key={repair.id}><div><strong>{repair.code}</strong><span>{repair.device ? `${repair.device.brand ?? ""} ${repair.device.model}`.trim() : "Chưa có thiết bị"}</span></div><StatusBadge value={repair.status} /></Link>)}
            {!activeRepairs.length ? <EmptyState title="Không có ca chờ xử lý" description="Tất cả ca sửa chữa đã hoàn tất." /> : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Metric({ label, value, note, accent = false }: { label: string; value: string; note: string; accent?: boolean }) {
  return <section className={`metric ${accent ? "metric-accent" : ""}`}><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-note">{note}</span></section>
}
