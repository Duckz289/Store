"use client"

import { useQuery } from "@tanstack/react-query"

import {
  Badge,
  ButtonLink,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusBadge,
  TableWrap,
} from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { SystemHealth } from "@/lib/types"

export default function SystemPage() {
  const query = useQuery({
    queryKey: ["system-health"],
    queryFn: () => adminFetch<SystemHealth>("/admin/system/health"),
    refetchInterval: 30_000,
    retry: false,
  })

  if (query.isLoading) return <LoadingState rows={8} />
  if (query.isError || !query.data) {
    return (
      <div className="stack">
        <PageHeader
          eyebrow="Hệ thống"
          title="Sức khỏe hệ thống"
          action={<ButtonLink href="/security/mfa">Xác minh MFA</ButtonLink>}
        />
        <ErrorState
          error={new Error(
            `${query.error?.message ?? "Không thể tải health check."} Hãy xác minh MFA rồi thử lại.`,
          )}
        />
      </div>
    )
  }

  const health = query.data
  const tone =
    health.status === "healthy"
      ? "success"
      : health.status === "degraded"
        ? "warning"
        : "danger"

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Hệ thống"
        title="Sức khỏe hệ thống"
        description="Theo dõi backend, dữ liệu bán hàng, bảo mật và request trace trong một nơi."
        action={
          <button
            className="button button-secondary"
            disabled={query.isFetching}
            onClick={() => query.refetch()}
          >
            {query.isFetching ? "Đang kiểm tra..." : "Kiểm tra lại"}
          </button>
        }
      />
      <div className="metric-strip system-metrics">
        <div>
          <span>Trạng thái</span>
          <strong><Badge tone={tone}>{health.status}</Badge></strong>
        </div>
        <div><span>Thời gian chạy</span><strong>{formatUptime(health.uptime_seconds)}</strong></div>
        <div><span>Bộ nhớ tiến trình</span><strong>{health.memory.rss_mb} MB</strong></div>
        <div><span>Kiểm tra gần nhất</span><strong>{formatDate(health.checked_at)}</strong></div>
      </div>
      <Panel title="Health checks" description="Kiểm tra quan trọng bị lỗi sẽ chuyển toàn hệ thống sang unhealthy.">
        <TableWrap>
          <table>
            <thead><tr><th>Thành phần</th><th>Trạng thái</th><th>Kết quả</th><th>Độ trễ</th></tr></thead>
            <tbody>
              {health.checks.map((check) => (
                <tr key={check.id}>
                  <td><strong>{check.label}</strong>{check.critical ? <span className="table-subline">Bắt buộc</span> : null}</td>
                  <td><Badge tone={check.status === "pass" ? "success" : check.status === "warn" ? "warning" : "danger"}>{check.status}</Badge></td>
                  <td>{check.message}</td>
                  <td className="numeric-cell">{check.latency_ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
      <Panel title="Request tracer" description="250 request gần nhất được giữ trong tiến trình. Request lỗi hoặc chậm cũng được ghi structured log.">
        {health.traces.length ? (
          <TableWrap>
            <table>
              <thead><tr><th>Thời điểm</th><th>Request</th><th>Kết quả</th><th>Độ trễ</th><th>Correlation ID</th></tr></thead>
              <tbody>
                {health.traces.map((trace) => (
                  <tr key={`${trace.correlation_id}-${trace.occurred_at}`}>
                    <td>{formatDate(trace.occurred_at)}</td>
                    <td><strong>{trace.method}</strong> {trace.path}</td>
                    <td><StatusBadge value={String(trace.status_code)} /></td>
                    <td className="numeric-cell">{trace.duration_ms} ms</td>
                    <td><code className="correlation-id">{trace.correlation_id}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <div className="state-block state-empty">Chưa có request trace trong tiến trình hiện tại.</div>
        )}
      </Panel>
      <Panel title="Audit gần đây" description="Log nghiệp vụ được lưu bền vững và kiểm tra integrity ở trang Audit log.">
        <TableWrap>
          <table>
            <thead><tr><th>Thời điểm</th><th>Hành động</th><th>Tài nguyên</th><th>Kết quả</th><th>Correlation ID</th></tr></thead>
            <tbody>
              {health.recent_audit.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.occurred_at)}</td>
                  <td>{event.action ?? "-"}</td>
                  <td>{event.resource_type ?? "-"}</td>
                  <td><StatusBadge value={event.outcome} /></td>
                  <td><code className="correlation-id">{event.correlation_id ?? "-"}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Panel>
    </div>
  )
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  return [days ? `${days} ngày` : "", hours ? `${hours} giờ` : "", `${minutes} phút`]
    .filter(Boolean)
    .join(" ")
}
