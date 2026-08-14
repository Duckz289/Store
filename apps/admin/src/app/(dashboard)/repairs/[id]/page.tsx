"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { FormEvent, useState } from "react"

import { DetailRow, ErrorState, Field, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate, formatMoney } from "@/lib/format"
import type { RepairCase, RepairStatus } from "@/lib/types"

const nextStatuses: RepairStatus[] = ["diagnosis", "quote", "repair", "quality_assurance", "return_ready", "returned", "closed", "canceled"]

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const client = useQueryClient()
  const [toStatus, setToStatus] = useState<RepairStatus>("diagnosis")
  const [note, setNote] = useState("")
  const [findings, setFindings] = useState("")
  const [recommendation, setRecommendation] = useState("")
  const query = useQuery({ queryKey: ["repair", id], queryFn: () => adminFetch<{ repair_case: RepairCase }>(`/admin/repairs/${id}`) })
  const refresh = () => client.invalidateQueries({ queryKey: ["repair", id] })
  const transition = useMutation({ mutationFn: () => adminFetch(`/admin/repairs/${id}/transitions`, { method: "POST", body: { to_status: toStatus, expected_revision: query.data?.repair_case.revision, public_note: note || null, reason_code: reasonCode(toStatus), idempotency_key: crypto.randomUUID() } }), onSuccess: refresh })
  const diagnosis = useMutation({ mutationFn: () => adminFetch(`/admin/repairs/${id}/diagnoses`, { method: "POST", body: { idempotency_key: crypto.randomUUID(), severity: "medium", findings, recommended_action: recommendation } }), onSuccess: () => { setFindings(""); setRecommendation(""); refresh() } })
  if (query.isLoading) return <LoadingState rows={8} />
  if (query.isError || !query.data) return <ErrorState error={query.error} />
  const repair = query.data.repair_case
  const submitTransition = (event: FormEvent) => { event.preventDefault(); transition.mutate() }
  const submitDiagnosis = (event: FormEvent) => { event.preventDefault(); diagnosis.mutate() }
  return <div className="stack"><PageHeader eyebrow="Phiếu sửa chữa" title={repair.code} description={`Cập nhật ${formatDate(repair.updated_at)} · phiên bản ${repair.revision}`} action={<StatusBadge value={repair.status} />} />
    <div className="grid layout-wide"><div className="stack"><Panel title="Thiết bị"><div className="panel-body detail-list"><DetailRow label="Thiết bị">{repair.device ? `${repair.device.brand ?? ""} ${repair.device.model}`.trim() : "-"}</DetailRow><DetailRow label="Loại">{repair.device?.device_type ?? "-"}</DetailRow><DetailRow label="Serial">{repair.device?.serial_number ?? "-"}</DetailRow><DetailRow label="Tình trạng">{repair.device?.condition_summary ?? "-"}</DetailRow><DetailRow label="SLA">{formatDate(repair.sla_due_at)}</DetailRow></div></Panel>
      <Panel title="Chẩn đoán" description="Ghi nhận kết quả kỹ thuật theo phiên bản"><div className="panel-body stack">{repair.diagnoses?.map((item) => <div className="record-card" key={item.id}><strong>Chẩn đoán v{item.version} · {item.severity}</strong><p>{item.findings}</p><span>{item.recommended_action}</span></div>)}<form className="form-stack" onSubmit={submitDiagnosis}><Field label="Phát hiện"><textarea required value={findings} onChange={(event) => setFindings(event.target.value)} /></Field><Field label="Hướng xử lý"><textarea required value={recommendation} onChange={(event) => setRecommendation(event.target.value)} /></Field>{diagnosis.isError ? <div className="form-error">{diagnosis.error.message}</div> : null}<button className="button" disabled={diagnosis.isPending}>Lưu chẩn đoán</button></form></div></Panel>
      <Panel title="Báo giá"><TableWrap><table><thead><tr><th>Phiên bản</th><th>Trạng thái</th><th>Tổng</th><th>Hiệu lực</th></tr></thead><tbody>{repair.quotes?.map((quote) => <tr key={quote.id}><td>v{quote.version}</td><td><StatusBadge value={quote.status} /></td><td>{formatMoney(quote.total, quote.currency_code)}</td><td>{formatDate(quote.valid_until)}</td></tr>)}</tbody></table></TableWrap>{!repair.quotes?.length ? <div className="state-block">Chưa có báo giá. API báo giá vẫn được giữ nguyên để tích hợp bước chi tiết tiếp theo.</div> : null}</Panel></div>
      <div className="stack"><Panel title="Chuyển trạng thái" description="Workflow backend sẽ kiểm tra transition hợp lệ"><form className="panel-body form-stack" onSubmit={submitTransition}><Field label="Trạng thái tiếp theo"><select value={toStatus} onChange={(event) => setToStatus(event.target.value as RepairStatus)}>{nextStatuses.map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></Field><Field label="Ghi chú cho khách"><textarea value={note} onChange={(event) => setNote(event.target.value)} /></Field>{transition.isError ? <div className="form-error">{transition.error.message}</div> : null}<button className="button" disabled={transition.isPending}>Cập nhật trạng thái</button></form></Panel>
      <Panel title="Lịch sử"><div className="panel-body timeline">{repair.status_history?.slice().reverse().map((item) => <div className="timeline-item" key={item.id}><span className="timeline-dot" /><div className="timeline-copy"><strong>{item.to_status.replaceAll("_", " ")}</strong><span>{formatDate(item.occurred_at)}</span></div></div>)}</div></Panel>
      <Panel title="Linh kiện"><div className="panel-body stack-small">{repair.parts?.map((part) => <div className="repair-brief" key={part.id}><div><strong>{part.title}</strong><span>{part.sku ?? "Không có SKU"} · SL {part.quantity}</span></div><StatusBadge value={part.status} /></div>)}{!repair.parts?.length ? <span className="page-description">Chưa ghi nhận linh kiện.</span> : null}</div></Panel></div></div>
  </div>
}

function reasonCode(status: RepairStatus) {
  if (status === "quality_assurance") return "repair_completed"
  if (status === "returned") return "handover_completed"
  if (status === "closed") return "case_completed"
  if (status === "canceled") return "early_cancel"
  return null
}
