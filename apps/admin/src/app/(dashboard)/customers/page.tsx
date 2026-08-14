"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, TableWrap } from "@/components/ui"
import { adminFetch, queryString } from "@/lib/api"
import { formatDate, maskPhone } from "@/lib/format"
import type { Customer } from "@/lib/types"

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const query = useQuery({ queryKey: ["customers", search], queryFn: () => adminFetch<{ customers: Customer[]; count: number }>(`/admin/customers${queryString({ q: search || undefined, limit: 100, order: "-created_at" })}`) })
  return <div className="stack"><PageHeader eyebrow="CRM" title="Khách hàng" description="Hồ sơ khách hàng và lịch sử mua hàng từ Customer và Order Module." /><Panel><div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, email hoặc số điện thoại" /><span className="toolbar-spacer">{query.data?.count ?? 0} khách hàng</span></div>{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState error={query.error} /> : query.data?.customers.length ? <TableWrap><table><thead><tr><th>Khách hàng</th><th>Email</th><th>Số điện thoại</th><th>Ngày tạo</th></tr></thead><tbody>{query.data.customers.map((customer) => <tr key={customer.id}><td><Link className="table-link" href={`/customers/${customer.id}`}>{[customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Chưa đặt tên"}</Link></td><td>{customer.email ?? "-"}</td><td>{maskPhone(customer.phone)}</td><td>{formatDate(customer.created_at)}</td></tr>)}</tbody></table></TableWrap> : <EmptyState title="Chưa có khách hàng" description="Khách hàng sẽ xuất hiện khi đăng ký hoặc hoàn thành đơn." />}</Panel></div>
}
