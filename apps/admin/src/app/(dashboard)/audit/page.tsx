"use client"

import { useQuery } from "@tanstack/react-query"
import { FormEvent, useState } from "react"

import { ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch, queryString } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { AuditEvent } from "@/lib/types"

export default function AuditPage() {
  const [actor, setActor] = useState("")
  const [resource, setResource] = useState("")
  const [filters, setFilters] = useState({ actor: "", resource: "" })
  const query = useQuery({ queryKey: ["audit", filters], queryFn: () => adminFetch<{ audit_events: AuditEvent[]; count: number }>(`/admin/security/audit-events${queryString({ actor_id: filters.actor || undefined, resource_type: filters.resource || undefined, limit: 100 })}`), retry: false })
  const submit = (event: FormEvent) => { event.preventDefault(); setFilters({ actor: actor.trim(), resource: resource.trim() }) }
  return <div className="stack"><PageHeader eyebrow="Hệ thống" title="Nhật ký kiểm toán" description="Audit trail từ backend; dữ liệu nhạy cảm before/after và metadata không được hiển thị." action={<ButtonLink href="/security/mfa" secondary>Xác minh MFA</ButtonLink>} /><Panel><form className="toolbar" onSubmit={submit}><input value={actor} onChange={(event) => setActor(event.target.value)} placeholder="Actor ID" /><input value={resource} onChange={(event) => setResource(event.target.value)} placeholder="Loại tài nguyên" /><button className="button button-secondary">Lọc</button></form>{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState error={new Error(`${query.error.message} Hãy xác minh MFA rồi tải lại.`)} /> : query.data?.audit_events.length ? <TableWrap><table><thead><tr><th>Thời điểm</th><th>Actor</th><th>Hành động</th><th>Tài nguyên</th><th>Kết quả</th><th>Correlation ID</th></tr></thead><tbody>{query.data.audit_events.map((event) => <tr key={event.id}><td>{formatDate(event.occurred_at)}</td><td>{event.actor_id ?? "-"}</td><td>{event.action ?? "-"}</td><td>{[event.resource_type, event.resource_id].filter(Boolean).join(": ") || "-"}</td><td><StatusBadge value={event.outcome} /></td><td>{event.correlation_id ?? "-"}</td></tr>)}</tbody></table></TableWrap> : <EmptyState title="Chưa có sự kiện phù hợp" description="Điều chỉnh bộ lọc hoặc thực hiện một thao tác vận hành." />}</Panel></div>
}
