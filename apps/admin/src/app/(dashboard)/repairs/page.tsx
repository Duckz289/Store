"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import { ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch, queryString } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { RepairCase } from "@/lib/types"

const statuses = [["", "Tất cả"], ["intake", "Tiếp nhận"], ["diagnosis", "Chẩn đoán"], ["quote", "Báo giá"], ["repair", "Đang sửa"], ["quality_assurance", "QA"], ["return_ready", "Chờ trả máy"], ["returned", "Đã trả máy"], ["closed", "Đã đóng"], ["canceled", "Đã hủy"]]

export default function RepairsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const query = useQuery({ queryKey: ["repairs", search, status], queryFn: () => adminFetch<{ repair_cases: RepairCase[]; count: number }>(`/admin/repairs${queryString({ q: search || undefined, status: status || undefined, limit: 100 })}`) })
  return <div className="stack"><PageHeader eyebrow="Dịch vụ" title="Sửa chữa" description="Luồng vận hành: tiếp nhận, chẩn đoán, báo giá, sửa chữa, QA và trả máy." action={<ButtonLink href="/repairs/new">Tiếp nhận máy</ButtonLink>} /><Panel><div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã repair, thiết bị, số điện thoại" /><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><span className="toolbar-spacer">{query.data?.count ?? 0} ca</span></div>{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState error={query.error} /> : query.data?.repair_cases.length ? <TableWrap><table><thead><tr><th>Mã</th><th>Thiết bị</th><th>Trạng thái</th><th>SLA</th><th>Cập nhật</th></tr></thead><tbody>{query.data.repair_cases.map((repair) => <tr key={repair.id}><td><Link className="table-link" href={`/repairs/${repair.id}`}>{repair.code}</Link></td><td>{repair.device ? `${repair.device.brand ?? ""} ${repair.device.model}`.trim() : "-"}<span className="table-subtitle">{repair.device?.serial_number ?? repair.device?.sku}</span></td><td><StatusBadge value={repair.status} /></td><td>{formatDate(repair.sla_due_at)}</td><td>{formatDate(repair.updated_at)}</td></tr>)}</tbody></table></TableWrap> : <EmptyState title="Chưa có ca sửa chữa" description="Tiếp nhận thiết bị đầu tiên để bắt đầu quy trình." action={<ButtonLink href="/repairs/new">Tiếp nhận máy</ButtonLink>} />}</Panel></div>
}
