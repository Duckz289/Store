import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Input, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { FormEvent, useState } from "react"
import { Link } from "react-router-dom"

import { sdk } from "../../../lib/sdk"
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NativeLink,
  PageContainer,
  PageHeader,
  StatusBadge,
  formatMoney,
} from "../shared"

type Product = {
  id: string
  title: string
  thumbnail?: string | null
  status?: string
  handle?: string
  collection?: { title?: string } | null
  categories?: { name: string }[]
  variants?: { sku?: string | null; calculated_price?: { calculated_amount?: number; currency_code?: string } }[]
}

type ProductResponse = { products: Product[]; count: number }

const CatalogOperationsPage = () => {
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const products = useQuery({
    queryKey: ["operations-products", query],
    queryFn: () => sdk.client.fetch<ProductResponse>(`/admin/products?limit=50${query ? `&q=${encodeURIComponent(query)}` : ""}`),
  })

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setQuery(search.trim())
  }

  return (
    <PageContainer>
      <PageHeader
        title="Danh mục sản phẩm"
        description="Danh sách dùng dữ liệu Product Module. Tạo và sửa chi tiết tiếp tục dùng trang Product chuẩn của Medusa để giữ variant, SKU và giá là nguồn sự thật."
        action={<Button size="small" asChild><Link to="/products/create">Tạo sản phẩm</Link></Button>}
      />
      <form className="flex gap-2 border-b px-6 py-4" onSubmit={submitSearch}>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên, handle hoặc SKU" aria-label="Tìm sản phẩm" />
        <Button type="submit" variant="secondary">Tìm</Button>
      </form>
      {products.isLoading ? <LoadingState /> : null}
      {products.error ? <ErrorState error={products.error} /> : null}
      {products.data && products.data.products.length === 0 ? <EmptyState title="Không có sản phẩm phù hợp" description="Thử thay đổi từ khóa hoặc tạo một sản phẩm mới." href="/products/create" action="Tạo sản phẩm" /> : null}
      {products.data?.products.length ? (
        <div className="overflow-x-auto">
          <Table>
            <Table.Header><Table.Row><Table.HeaderCell>Sản phẩm</Table.HeaderCell><Table.HeaderCell>SKU</Table.HeaderCell><Table.HeaderCell>Phân loại</Table.HeaderCell><Table.HeaderCell>Giá</Table.HeaderCell><Table.HeaderCell>Trạng thái</Table.HeaderCell></Table.Row></Table.Header>
            <Table.Body>
              {products.data.products.map((product) => {
                const variant = product.variants?.[0]
                return <Table.Row key={product.id}>
                  <Table.Cell><div className="flex min-w-52 items-center gap-3">{product.thumbnail ? <img className="h-9 w-9 rounded object-cover" src={product.thumbnail} alt="" /> : <div className="h-9 w-9 rounded bg-ui-bg-subtle" />}<div><NativeLink to={`/products/${product.id}`}>{product.title}</NativeLink><Text size="xsmall" className="text-ui-fg-subtle">{product.handle || "-"}</Text></div></div></Table.Cell>
                  <Table.Cell>{variant?.sku || "-"}</Table.Cell>
                  <Table.Cell>{product.categories?.map((category) => category.name).join(", ") || product.collection?.title || "-"}</Table.Cell>
                  <Table.Cell>{formatMoney(variant?.calculated_price?.calculated_amount, variant?.calculated_price?.currency_code)}</Table.Cell>
                  <Table.Cell><StatusBadge value={product.status} /></Table.Cell>
                </Table.Row>
              })}
            </Table.Body>
          </Table>
        </div>
      ) : null}
    </PageContainer>
  )
}

export const config = defineRouteConfig({ label: "Danh mục", rank: 6 })
export default CatalogOperationsPage
