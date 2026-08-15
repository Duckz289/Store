"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

import {
  Badge,
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  TableWrap,
} from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { StaffRole, StaffUser } from "@/lib/types"

type StaffResponse = {
  users: StaffUser[]
  roles: StaffRole[]
  system_owner_count: number
}

export default function StaffPage() {
  const queryClient = useQueryClient()
  const [draftRoles, setDraftRoles] = useState<Record<string, string>>( {})
  const query = useQuery({
    queryKey: ["system-staff"],
    queryFn: () => adminFetch<StaffResponse>("/admin/system/staff"),
    retry: false,
  })
  useEffect(() => {
    if (!query.data) return
    setDraftRoles(
      Object.fromEntries(
        query.data.users.map((user) => [
          user.id,
          user.is_system_owner
            ? "system-owner"
            : user.rbac_roles?.find((role) =>
                query.data?.roles.some(
                  (available) => available.id === role.id && available.assignable,
                ),
              )?.id ?? "",
        ]),
      ),
    )
  }, [query.data])

  const assignment = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      adminFetch(`/admin/system/staff/${userId}/role`, {
        method: "POST",
        body: { role_id: roleId || null },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system-staff"] }),
  })

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Hệ thống"
        title="Nhân viên & bảo mật"
        description="Chỉ System Owner có thể thay đổi vai trò. Owner quản lý toàn bộ vận hành nhưng không quản trị hệ thống."
        action={<ButtonLink href="/security/mfa">Xác minh MFA</ButtonLink>}
      />
      {query.data ? (
        <div className="metric-strip">
          <div><span>System Owner</span><strong>{query.data.system_owner_count}</strong></div>
          <div><span>Tài khoản nhân viên</span><strong>{query.data.users.length}</strong></div>
          <div><span>Vai trò vận hành</span><strong>{query.data.roles.filter((role) => role.assignable).length}</strong></div>
        </div>
      ) : null}
      <Panel>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState
            error={new Error(
              `${query.error.message} Hãy xác minh MFA rồi tải lại trang.`,
            )}
          />
        ) : query.data?.users.length ? (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {query.data.users.map((user) => {
                  const name =
                    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
                    "Chưa đặt tên"
                  return (
                    <tr key={user.id}>
                      <td>
                        <strong>{name}</strong>
                        {user.is_system_owner ? (
                          <div className="table-subline"><Badge tone="info">Cao nhất</Badge></div>
                        ) : null}
                      </td>
                      <td>{user.email ?? "-"}</td>
                      <td>
                        {user.is_system_owner ? (
                          <strong>System Owner</strong>
                        ) : (
                          <select
                            aria-label={`Vai trò của ${name}`}
                            value={draftRoles[user.id] ?? ""}
                            onChange={(event) =>
                              setDraftRoles((current) => ({
                                ...current,
                                [user.id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Tạm khóa quyền</option>
                            {query.data.roles
                              .filter((role) => role.assignable)
                              .map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        {!user.is_system_owner ? (
                          <button
                            className="button button-secondary button-small"
                            disabled={assignment.isPending}
                            onClick={() =>
                              assignment.mutate({
                                userId: user.id,
                                roleId: draftRoles[user.id] ?? "",
                              })
                            }
                          >
                            Lưu quyền
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            title="Chưa có tài khoản nhân viên"
            description="Tạo user bằng Medusa CLI, sau đó gán vai trò tại đây."
          />
        )}
        {assignment.isError ? (
          <div className="form-error">{assignment.error.message}</div>
        ) : null}
      </Panel>
      <Panel title="Ranh giới quyền">
        <div className="panel-body role-boundaries">
          <div><strong>System Owner</strong><span>Bảo mật, phân quyền, audit log và health tracer. Chỉ có một tài khoản.</span></div>
          <div><strong>Owner</strong><span>Toàn quyền sản phẩm, kho, đơn hàng, khuyến mãi, sửa chữa và khách hàng.</span></div>
          <div><strong>Nhân viên chuyên trách</strong><span>Chỉ thấy và thao tác đúng nghiệp vụ được giao.</span></div>
        </div>
      </Panel>
    </div>
  )
}
