"use client"

import { useQuery } from "@tanstack/react-query"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { ButtonLink, EmptyState, ErrorState, LoadingState, PageHeader, Panel, StatusBadge, TableWrap } from "@/components/ui"
import { adminFetch, queryString } from "@/lib/api"
import { formatMoney } from "@/lib/format"
import type { Product } from "@/lib/types"

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("q") ?? "")
  const [status, setStatus] = useState("")
  const query = useQuery({
    queryKey: ["products", search, status],
    queryFn: () => adminFetch<{ products: Product[]; count: number }>(`/admin/products${queryString({ q: search || undefined, status: status || undefined, limit: 100, fields: "+variants.prices,+variants.inventory_quantity" })}`),
  })

  return <div className="stack">
    <PageHeader eyebrow="Danh mục" title="Sản phẩm" description="Quản lý nội dung, giá, SKU, tồn kho, thương hiệu, model, thông số và media." action={<ButtonLink href="/products/new">Thêm sản phẩm</ButtonLink>} />
    <Panel>
      <div className="toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, handle hoặc SKU" /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả trạng thái</option><option value="published">Đang bán</option><option value="draft">Bản nháp</option><option value="proposed">Chờ duyệt</option><option value="rejected">Từ chối</option></select><span className="toolbar-spacer">{query.data?.count ?? 0} sản phẩm</span></div>
      {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState error={query.error} /> : query.data?.products.length ? <TableWrap><table><thead><tr><th>Sản phẩm</th><th>SKU</th><th>Giá</th><th>Tồn</th><th>Trạng thái</th></tr></thead><tbody>
        {query.data.products.map((product) => { const variant = product.variants?.[0]; const directPrice = variant?.prices?.[0]; return <tr key={product.id}><td><div className="table-main">{product.thumbnail ? <Image unoptimized width={38} height={38} className="thumbnail" src={product.thumbnail} alt={product.title} /> : <span className="thumbnail" />}<div><Link className="table-link" href={`/products/${product.id}`}>{product.title}</Link><span className="table-subtitle">/{product.handle}</span></div></div></td><td>{variant?.sku ?? "-"}</td><td>{formatMoney(directPrice?.amount ?? variant?.calculated_price?.calculated_amount, directPrice?.currency_code ?? variant?.calculated_price?.currency_code)}</td><td>{variant?.inventory_quantity ?? "-"}</td><td><StatusBadge value={product.status} /></td></tr> })}
      </tbody></table></TableWrap> : <EmptyState title="Chưa có sản phẩm" description="Tạo sản phẩm đầu tiên để bắt đầu bán hàng." action={<ButtonLink href="/products/new">Thêm sản phẩm</ButtonLink>} />}
    </Panel>
  </div>
}
