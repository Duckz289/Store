"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { EmptyState, ErrorState, LoadingState, PageHeader, Panel, TableWrap } from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { InventoryItem } from "@/lib/types"

export default function InventoryPage() {
  const [search, setSearch] = useState("")
  const query = useQuery({ queryKey: ["inventory"], queryFn: () => adminFetch<{ inventory_items: InventoryItem[]; count: number }>("/admin/inventory-items?limit=100&fields=id,sku,title,*location_levels,+location_levels.location") })
  const items = query.data?.inventory_items.filter((item) => `${item.sku} ${item.title}`.toLowerCase().includes(search.toLowerCase())) ?? []
  return <div className="stack"><PageHeader eyebrow="Nguồn hàng" title="Kho hàng" description="Inventory Module là nguồn sự thật duy nhất; dashboard không ghi trực tiếp cơ sở dữ liệu." /><Panel><div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm SKU hoặc tên mặt hàng" /><span className="toolbar-spacer">{items.length} SKU</span></div>{query.isLoading ? <LoadingState /> : query.isError ? <ErrorState error={query.error} /> : items.length ? <TableWrap><table><thead><tr><th>SKU</th><th>Mặt hàng</th><th>Có thể bán</th><th>Đã giữ</th><th>Đang có</th><th>Vị trí</th></tr></thead><tbody>{items.map((item) => { const levels = item.location_levels ?? []; return <tr key={item.id}><td><strong>{item.sku ?? "-"}</strong></td><td>{item.title ?? "-"}</td><td>{levels.reduce((sum, level) => sum + (level.available_quantity ?? 0), 0)}</td><td>{levels.reduce((sum, level) => sum + (level.reserved_quantity ?? 0), 0)}</td><td>{levels.reduce((sum, level) => sum + (level.stocked_quantity ?? 0), 0)}</td><td>{levels.map((level) => level.location?.name ?? level.location_id).filter(Boolean).join(", ") || "-"}</td></tr> })}</tbody></table></TableWrap> : <EmptyState title="Chưa có mục tồn kho" description="Tồn kho xuất hiện khi variant được liên kết với Inventory Module." />}</Panel></div>
}
