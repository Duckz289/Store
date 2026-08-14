import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"

import { sdk } from "../../../lib/sdk"
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader, StatusBadge, formatDate } from "../shared"

type User = { id: string; first_name?: string | null; last_name?: string | null; email?: string; created_at?: string; metadata?: Record<string, unknown> | null }
type UserResponse = { users: User[]; count: number }

const SecurityOperationsPage = () => {
  const users = useQuery({ queryKey: ["operations-users"], queryFn: () => sdk.client.fetch<UserResponse>("/admin/users?limit=100") })
  return <PageContainer>
    <PageHeader title="Nhân viên và bảo mật" description="Danh sách chỉ hiển thị dữ liệu User Module được phép đọc. Quyền, MFA và mọi quyết định ủy quyền vẫn do Medusa và security policies thực thi ở backend." action={<Button size="small" variant="secondary" asChild><Link to="/security/mfa">Thiết lập MFA</Link></Button>} />
    {users.isLoading ? <LoadingState /> : null}{users.error ? <ErrorState error={users.error} /> : null}
    {users.data && !users.data.users.length ? <EmptyState title="Chưa có tài khoản nhân viên" description="Quản lý tài khoản qua phần Settings chuẩn của Medusa." /> : null}
    {users.data?.users.length ? <div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.HeaderCell>Nhân viên</Table.HeaderCell><Table.HeaderCell>Email</Table.HeaderCell><Table.HeaderCell>Vai trò</Table.HeaderCell><Table.HeaderCell>MFA</Table.HeaderCell><Table.HeaderCell>Ngày tạo</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{users.data.users.map((user) => <Table.Row key={user.id}><Table.Cell>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Chưa đặt tên"}</Table.Cell><Table.Cell>{user.email || "-"}</Table.Cell><Table.Cell><Badge>Backend quản lý</Badge></Table.Cell><Table.Cell><StatusBadge value={typeof user.metadata?.mfa_status === "string" ? user.metadata.mfa_status : "Kiểm tra trong phiên"} /></Table.Cell><Table.Cell>{formatDate(user.created_at)}</Table.Cell></Table.Row>)}</Table.Body></Table></div> : null}
    <div className="border-t px-6 py-4"><Text size="small" className="text-ui-fg-subtle">Trạng thái MFA đầy đủ là dữ liệu nhạy cảm theo phiên. Trang này không suy diễn trạng thái từ metadata không được backend xác nhận.</Text></div>
  </PageContainer>
}

export const config = defineRouteConfig({ label: "Nhân viên", rank: 11 })
export default SecurityOperationsPage
