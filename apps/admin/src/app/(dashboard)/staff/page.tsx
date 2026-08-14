"use client"

import { useQuery } from "@tanstack/react-query"

import { ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { StaffUser } from "@/lib/types"

export default function StaffPage() {
  const query = useQuery({ queryKey: ["staff"], queryFn: () => adminFetch<{ users: StaffUser[]; count: number }>("/admin/users?limit=100&fields=+rbac_roles") })
  return <div className="stack"><PageHeader eyebrow="Hệ thống" title="Nhân viên & bảo mật" description="Tài khoản, vai trò và kiểm soát truy cập vẫn do backend Medusa thực thi." action={<ButtonLink href="/security/mfa">Xác minh MFA</ButtonLink>} /><Panel>{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState error={query.error} /> : query.data?.users.length ? <TableWrap><table><thead><tr><th>Nhân viên</th><th>Email</th><th>Vai trò</th><th>MFA</th><th>Ngày tạo</th></tr></thead><tbody>{query.data.users.map((user) => <tr key={user.id}><td><strong>{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Chưa đặt tên"}</strong></td><td>{user.email ?? "-"}</td><td>{user.rbac_roles?.map((role) => role.name).join(", ") || "Backend quản lý"}</td><td><StatusBadge value="Theo phiên" /></td><td>{formatDate(user.created_at)}</td></tr>)}</tbody></table></TableWrap> : <EmptyState title="Chưa có tài khoản nhân viên" description="Tạo user bằng Medusa CLI hoặc Admin API với quyền phù hợp." />}</Panel><Panel title="Nguyên tắc bảo mật"><div className="panel-body"><p className="page-description">Các thao tác nhạy cảm yêu cầu MFA step-up theo phiên. Custom Admin không tự suy diễn quyền và không lưu credential trong localStorage.</p></div></Panel></div>
}
