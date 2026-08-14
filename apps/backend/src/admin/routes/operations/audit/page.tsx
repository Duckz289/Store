import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Input, Table } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { FormEvent, useState } from "react"
import { Link } from "react-router-dom"

import { sdk } from "../../../lib/sdk"
import { EmptyState, ErrorState, LoadingState, PageContainer, PageHeader, StatusBadge, formatDate } from "../shared"

type AuditEvent = { id: string; actor_id?: string | null; action?: string; resource_type?: string; resource_id?: string | null; outcome?: string; occurred_at?: string; correlation_id?: string | null }
type AuditResponse = { audit_events: AuditEvent[]; count: number }

const AuditOperationsPage = () => {
  const [actor, setActor] = useState("")
  const [resource, setResource] = useState("")
  const [filters, setFilters] = useState({ actor: "", resource: "" })
  const events = useQuery({
    queryKey: ["operations-audit", filters],
    queryFn: () => {
      const params = new URLSearchParams({ limit: "100" })
      if (filters.actor) params.set("actor_id", filters.actor)
      if (filters.resource) params.set("resource_type", filters.resource)
      return sdk.client.fetch<AuditResponse>(`/admin/security/audit-events?${params.toString()}`)
    },
  })
  const submit = (event: FormEvent) => { event.preventDefault(); setFilters({ actor: actor.trim(), resource: resource.trim() }) }

  return <PageContainer>
    <PageHeader title="Nhật ký kiểm toán" description="Dữ liệu được lấy từ audit trail có sẵn. Endpoint yêu cầu xác thực MFA step-up, và UI không hiển thị before/after hoặc metadata để tránh rò rỉ dữ liệu nhạy cảm." action={<Button size="small" variant="secondary" asChild><Link to="/security/mfa">Xác minh MFA</Link></Button>} />
    <form className="grid gap-2 border-b px-6 py-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={submit}><Input value={actor} onChange={(event) => setActor(event.target.value)} placeholder="Lọc actor ID" aria-label="Lọc actor ID" /><Input value={resource} onChange={(event) => setResource(event.target.value)} placeholder="Lọc loại tài nguyên" aria-label="Lọc loại tài nguyên" /><Button type="submit" variant="secondary">Lọc</Button></form>
    {events.isLoading ? <LoadingState /> : null}{events.error ? <ErrorState error={events.error} /> : null}
    {events.data && !events.data.audit_events.length ? <EmptyState title="Chưa có sự kiện phù hợp" description="Nếu vừa xác minh MFA, hãy tải lại hoặc điều chỉnh bộ lọc." /> : null}
    {events.data?.audit_events.length ? <div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.HeaderCell>Thời điểm</Table.HeaderCell><Table.HeaderCell>Actor</Table.HeaderCell><Table.HeaderCell>Hành động</Table.HeaderCell><Table.HeaderCell>Tài nguyên</Table.HeaderCell><Table.HeaderCell>Kết quả</Table.HeaderCell><Table.HeaderCell>Correlation ID</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{events.data.audit_events.map((item) => <Table.Row key={item.id}><Table.Cell>{formatDate(item.occurred_at)}</Table.Cell><Table.Cell>{item.actor_id || "-"}</Table.Cell><Table.Cell>{item.action || "-"}</Table.Cell><Table.Cell>{[item.resource_type, item.resource_id].filter(Boolean).join(": ") || "-"}</Table.Cell><Table.Cell><StatusBadge value={item.outcome} /></Table.Cell><Table.Cell>{item.correlation_id || "-"}</Table.Cell></Table.Row>)}</Table.Body></Table></div> : null}
  </PageContainer>
}

export const config = defineRouteConfig({ label: "Audit log", rank: 12 })
export default AuditOperationsPage
