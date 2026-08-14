import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"

import { sdk } from "../../../lib/sdk"
import { EmptyState, ErrorState, LoadingState, NativeLink, PageContainer, PageHeader } from "../shared"

type InventoryLevel = { location_id?: string; stocked_quantity?: number; reserved_quantity?: number; available_quantity?: number; location?: { name?: string } }
type InventoryItem = { id: string; sku?: string | null; title?: string | null; location_levels?: InventoryLevel[] }
type InventoryResponse = { inventory_items: InventoryItem[]; count: number }

const InventoryOperationsPage = () => {
  const inventory = useQuery({ queryKey: ["operations-inventory"], queryFn: () => sdk.client.fetch<InventoryResponse>("/admin/inventory-items?limit=100") })
  return <PageContainer>
    <PageHeader title="Kho hàng" description="Inventory Module là nguồn sự thật. Bản phát hành này chỉ trình bày mức tồn hiện có, không tạo Goods Receipt hay Stock Movement riêng." />
    {inventory.isLoading ? <LoadingState /> : null}{inventory.error ? <ErrorState error={inventory.error} /> : null}
    {inventory.data && !inventory.data.inventory_items.length ? <EmptyState title="Chưa có mục tồn kho" description="Tồn kho sẽ xuất hiện khi variant được liên kết với Inventory Module." /> : null}
    {inventory.data?.inventory_items.length ? <div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.HeaderCell>SKU</Table.HeaderCell><Table.HeaderCell>Sản phẩm</Table.HeaderCell><Table.HeaderCell>Có thể bán</Table.HeaderCell><Table.HeaderCell>Đã giữ</Table.HeaderCell><Table.HeaderCell>Vị trí</Table.HeaderCell></Table.Row></Table.Header><Table.Body>{inventory.data.inventory_items.map((item) => { const levels = item.location_levels || []; const available = levels.reduce((sum, level) => sum + (level.available_quantity ?? level.stocked_quantity ?? 0), 0); const reserved = levels.reduce((sum, level) => sum + (level.reserved_quantity ?? 0), 0); return <Table.Row key={item.id}><Table.Cell><NativeLink to={`/inventory/${item.id}`}>{item.sku || "-"}</NativeLink></Table.Cell><Table.Cell>{item.title || "-"}</Table.Cell><Table.Cell>{available}</Table.Cell><Table.Cell>{reserved}</Table.Cell><Table.Cell><Text size="small">{levels.map((level) => level.location?.name || level.location_id).filter(Boolean).join(", ") || "-"}</Text></Table.Cell></Table.Row> })}</Table.Body></Table></div> : null}
  </PageContainer>
}

export const config = defineRouteConfig({ label: "Kho hàng", rank: 9 })
export default InventoryOperationsPage
