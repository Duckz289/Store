import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Table } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

import { sdk } from "../../../lib/sdk"
import { EmptyState, ErrorState, LoadingState, NativeLink, PageContainer, PageHeader, formatDate } from "../shared"

type Customer = { id: string; first_name?: string | null; last_name?: string | null; email?: string; phone?: string | null; created_at?: string }
type CustomerResponse = { customers: Customer[]; count: number }
const maskPhone = (phone?: string | null) => !phone ? "-" : phone.length < 5 ? "***" : `${phone.slice(0, 3)}${"*".repeat(Math.max(3, phone.length - 5))}${phone.slice(-2)}`

const CustomersOperationsPage = () => {
  const customers = useQuery({ queryKey: ["operations-customers"], queryFn: () => sdk.client.fetch<CustomerResponse>("/admin/customers?limit=100&order=-created_at") })
  return <PageContainer>
    <PageHeader title="Khách hàng" description="Danh sách sử dụng Customer Module. Chi tiết hồ sơ, địa chỉ và lịch sử đơn vẫn mở bằng trang chuẩn với quyền truy cập do backend kiểm soát." />
    {customers.isLoading ? <LoadingState /> : null}{customers.error ? <ErrorState error={customers.error} /> : null}
    {customers.data && !customers.data.customers.length ? <EmptyState title="Chưa có khách hàng" description="Khách hàng xuất hiện sau khi đăng ký hoặc hoàn thành đơn hàng." /> : null}
    {customers.data?.customers.length ? <div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.HeaderCell>Khách hàng</Table.HeaderCell><Table.HeaderCell>Email</Table.HeaderCell><Table.HeaderCell>Số điện thoại</Table.HeaderCell><Table.HeaderCell>Ngày tạo</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{customers.data.customers.map((customer) => <Table.Row key={customer.id}><Table.Cell><NativeLink to={`/customers/${customer.id}`}>{[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Chưa đặt tên"}</NativeLink></Table.Cell><Table.Cell>{customer.email || "-"}</Table.Cell><Table.Cell>{maskPhone(customer.phone)}</Table.Cell><Table.Cell>{formatDate(customer.created_at)}</Table.Cell></Table.Row>)}</Table.Body></Table></div> : null}
  </PageContainer>
}

export const config = defineRouteConfig({ label: "Khách hàng", rank: 10 })
export default CustomersOperationsPage
