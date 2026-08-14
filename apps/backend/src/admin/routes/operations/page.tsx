import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import { sdk } from "../../lib/sdk"
import type { RepairListResponse } from "../../types/repair"
import {
  ErrorState,
  LoadingState,
  NativeLink,
  PageContainer,
  PageHeader,
  StatusBadge,
  formatDate,
  formatMoney,
} from "./shared"

type Order = {
  id: string
  display_id?: number
  email?: string
  total?: number
  currency_code?: string
  created_at?: string
  payment_status?: string
  fulfillment_status?: string
  customer?: { first_name?: string; last_name?: string; email?: string }
}

type OrderListResponse = { orders: Order[]; count: number }
type CountResponse = { count: number }

const startOfToday = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.toISOString()
}

const OperationsDashboardPage = () => {
  const dashboard = useQuery({
    queryKey: ["operations-dashboard"],
    queryFn: async () => {
      const today = encodeURIComponent(startOfToday())
      const [todayOrders, recentOrders, products, inventory, repairs] =
        await Promise.all([
          sdk.client.fetch<CountResponse>(
            `/admin/orders?limit=1&created_at[$gte]=${today}`
          ),
          sdk.client.fetch<OrderListResponse>(
            "/admin/orders?limit=8&order=-created_at"
          ),
          sdk.client.fetch<CountResponse>("/admin/products?limit=1"),
          sdk.client.fetch<CountResponse>("/admin/inventory-items?limit=1"),
          sdk.client.fetch<RepairListResponse>("/admin/repairs?limit=20"),
        ])

      return { todayOrders, recentOrders, products, inventory, repairs }
    },
  })

  const repairsNeedingWork =
    dashboard.data?.repairs.repair_cases.filter((repair) =>
      ["intake", "diagnosis", "quote", "awaiting_customer_decision"].includes(
        repair.status
      )
    ).length ?? 0

  return (
    <PageContainer>
      <PageHeader
        title="Điều hành cửa hàng"
        description="Tổng quan chỉ đọc từ các API Medusa hiện có. Các thao tác nhạy cảm vẫn được backend áp dụng RBAC và MFA."
        action={
          <Button size="small" variant="secondary" asChild>
            <Link to="/repairs">Mở hồ sơ sửa chữa</Link>
          </Button>
        }
      />
      {dashboard.isLoading ? <LoadingState /> : null}
      {dashboard.error ? <ErrorState error={dashboard.error} /> : null}
      {dashboard.data ? (
        <div className="grid gap-6 px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Đơn mới hôm nay" value={dashboard.data.todayOrders.count} href="/operations/orders" />
            <Metric label="Tổng sản phẩm" value={dashboard.data.products.count} href="/operations/catalog" />
            <Metric label="SKU tồn kho" value={dashboard.data.inventory.count} href="/operations/inventory" />
            <Metric label="Hồ sơ cần xử lý" value={repairsNeedingWork} href="/repairs" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <section className="overflow-hidden rounded-lg border border-ui-border-base">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <Heading level="h2">Đơn hàng gần đây</Heading>
                <NativeLink to="/operations/orders">Xem tất cả</NativeLink>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Mã đơn</Table.HeaderCell>
                      <Table.HeaderCell>Khách hàng</Table.HeaderCell>
                      <Table.HeaderCell>Thanh toán</Table.HeaderCell>
                      <Table.HeaderCell>Tổng tiền</Table.HeaderCell>
                      <Table.HeaderCell>Trạng thái</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {dashboard.data.recentOrders.orders.map((order) => (
                      <Table.Row key={order.id}>
                        <Table.Cell>
                          <NativeLink to={`/orders/${order.id}`}>
                            #{order.display_id ?? order.id.slice(-8)}
                          </NativeLink>
                        </Table.Cell>
                        <Table.Cell>
                          {[order.customer?.first_name, order.customer?.last_name]
                            .filter(Boolean)
                            .join(" ") || order.email || order.customer?.email || "-"}
                        </Table.Cell>
                        <Table.Cell><StatusBadge value={order.payment_status} /></Table.Cell>
                        <Table.Cell>{formatMoney(order.total, order.currency_code)}</Table.Cell>
                        <Table.Cell><StatusBadge value={order.fulfillment_status} /></Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            </section>

            <section className="rounded-lg border border-ui-border-base p-4">
              <Heading level="h2">Việc cần làm</Heading>
              <div className="mt-3 grid gap-3">
                <WorkItem to="/repairs" label="Hồ sơ sửa chữa đang mở" value={repairsNeedingWork} />
                <WorkItem to="/operations/inventory" label="Kiểm tra ngưỡng tồn kho" value="Cần cấu hình" />
                <WorkItem to="/operations/promotions" label="Khuyến mãi" value="Xem thời hạn" />
                <WorkItem to="/operations/audit" label="Nhật ký kiểm toán" value="Yêu cầu MFA" />
              </div>
              <Text size="small" className="mt-4 text-ui-fg-subtle">
                Dashboard không suy diễn SKU sắp hết khi hệ thống chưa có ngưỡng tồn kho.
              </Text>
            </section>
          </div>

          <section className="rounded-lg border border-ui-border-base p-4">
            <div className="flex items-center justify-between">
              <Heading level="h2">Hồ sơ sửa chữa vừa cập nhật</Heading>
              <NativeLink to="/repairs">Xem tất cả</NativeLink>
            </div>
            <div className="mt-3 grid gap-2">
              {dashboard.data.repairs.repair_cases.slice(0, 5).map((repair) => (
                <Link
                  key={repair.id}
                  to={`/repairs/${repair.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ui-border-base px-3 py-2 transition-colors hover:bg-ui-bg-subtle"
                >
                  <span className="font-medium">{repair.code}</span>
                  <span className="text-ui-fg-subtle">
                    {[repair.device?.brand, repair.device?.model].filter(Boolean).join(" ") || "Chưa xác định thiết bị"}
                  </span>
                  <Badge>{repair.status.replace(/_/g, " ")}</Badge>
                  <span className="text-sm text-ui-fg-subtle">{formatDate(repair.updated_at)}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </PageContainer>
  )
}

const Metric = ({ label, value, href }: { label: string; value: number; href: string }) => (
  <Link
    to={href}
    className="rounded-lg border border-ui-border-base p-4 transition-colors hover:bg-ui-bg-subtle"
  >
    <Text size="small" className="text-ui-fg-subtle">{label}</Text>
    <Text className="mt-1 text-2xl font-semibold">{value.toLocaleString("vi-VN")}</Text>
  </Link>
)

const WorkItem = ({ to, label, value }: { to: string; label: string; value: number | string }) => (
  <Link to={to} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-ui-bg-subtle">
    <Text>{label}</Text>
    <Badge>{value}</Badge>
  </Link>
)

export const config = defineRouteConfig({
  label: "Điều hành",
  rank: 5,
})

export default OperationsDashboardPage
