"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FormEvent, useMemo, useState } from "react"

import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Panel,
  TableWrap,
} from "@/components/ui"
import { adminFetch } from "@/lib/api"
import type { InventoryItem, StockLocation } from "@/lib/types"

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [inventoryItemId, setInventoryItemId] = useState("")
  const [locationId, setLocationId] = useState("")
  const [direction, setDirection] = useState<"in" | "out">("in")
  const [quantity, setQuantity] = useState("1")
  const [reason, setReason] = useState("receiving")
  const [note, setNote] = useState("")

  const query = useQuery({
    queryKey: ["inventory"],
    queryFn: () =>
      adminFetch<{ inventory_items: InventoryItem[]; count: number }>(
        "/admin/inventory-items?limit=100&fields=id,sku,title,*location_levels,+location_levels.location",
      ),
  })
  const locations = useQuery({
    queryKey: ["stock-locations"],
    queryFn: () =>
      adminFetch<{ stock_locations: StockLocation[] }>(
        "/admin/stock-locations?limit=100&fields=id,name",
      ),
  })
  const items = useMemo(
    () =>
      query.data?.inventory_items.filter((item) =>
        `${item.sku} ${item.title}`.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [query.data, search],
  )

  const adjustment = useMutation({
    mutationFn: () => {
      const amount = Math.abs(Number(quantity))
      if (!Number.isInteger(amount) || amount < 1) {
        throw new Error("Số lượng phải là số nguyên lớn hơn 0.")
      }
      return adminFetch("/admin/inventory/adjustments", {
        method: "POST",
        body: {
          inventory_item_id: inventoryItemId,
          location_id: locationId,
          delta: direction === "in" ? amount : -amount,
          reason,
          note: note.trim() || null,
          idempotency_key: crypto.randomUUID(),
        },
      })
    },
    onSuccess: async () => {
      setNote("")
      await queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    adjustment.mutate()
  }
  const selected = query.data?.inventory_items.find(
    (item) => item.id === inventoryItemId,
  )
  const selectedLevel = selected?.location_levels?.find(
    (level) => level.location_id === locationId,
  )

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Nguồn hàng"
        title="Kho hàng"
        description="Nhập hàng, xuất điều chỉnh và theo dõi tồn khả dụng qua Inventory Module."
      />
      <Panel
        title="Điều chỉnh tồn kho"
        description="Mỗi lần thay đổi đều có người thực hiện, lý do và correlation ID trong audit log."
      >
        <form className="panel-body form-stack" onSubmit={submit}>
          <div className="inventory-adjust-grid">
            <Field label="SKU hoặc mặt hàng">
              <select
                required
                value={inventoryItemId}
                onChange={(event) => setInventoryItemId(event.target.value)}
              >
                <option value="">Chọn mặt hàng</option>
                {query.data?.inventory_items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {[item.sku, item.title].filter(Boolean).join(" | ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vị trí kho">
              <select
                required
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
              >
                <option value="">Chọn vị trí</option>
                {locations.data?.stock_locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Loại thao tác">
              <select
                value={direction}
                onChange={(event) => {
                  const value = event.target.value as "in" | "out"
                  setDirection(value)
                  setReason(value === "in" ? "receiving" : "correction")
                }}
              >
                <option value="in">Nhập thêm</option>
                <option value="out">Xuất điều chỉnh</option>
              </select>
            </Field>
            <Field label="Số lượng">
              <input
                required
                min="1"
                step="1"
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Field>
            <Field label="Lý do">
              <select value={reason} onChange={(event) => setReason(event.target.value)}>
                <option value="receiving">Nhập hàng mới</option>
                <option value="return">Khách trả lại</option>
                <option value="correction">Kiểm kê điều chỉnh</option>
                <option value="damage">Hư hỏng hoặc thất thoát</option>
              </select>
            </Field>
            <Field label="Ghi chú" hint="Không ghi mật khẩu hoặc dữ liệu nhạy cảm">
              <input
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Số phiếu nhập, nhà cung cấp hoặc lý do"
              />
            </Field>
          </div>
          <div className="quick-actions" aria-label="Chọn nhanh số lượng">
            {[1, 5, 10, 25].map((amount) => (
              <button
                key={amount}
                type="button"
                className="button button-secondary button-small"
                onClick={() => setQuantity(String(amount))}
              >
                {amount}
              </button>
            ))}
            <span className="toolbar-spacer">
              Đang có: {selectedLevel?.stocked_quantity ?? 0}
            </span>
            <button
              className="button"
              disabled={
                !inventoryItemId || !locationId || adjustment.isPending
              }
            >
              {adjustment.isPending ? "Đang cập nhật..." : "Cập nhật tồn"}
            </button>
          </div>
          {adjustment.isError ? (
            <div className="form-error">{adjustment.error.message}</div>
          ) : null}
          {adjustment.isSuccess ? (
            <div className="form-success">Tồn kho đã được cập nhật.</div>
          ) : null}
        </form>
      </Panel>
      <Panel>
        <div className="toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm SKU hoặc tên mặt hàng"
          />
          <span className="toolbar-spacer">{items.length} SKU</span>
        </div>
        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <ErrorState error={query.error} />
        ) : items.length ? (
          <TableWrap>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Mặt hàng</th>
                  <th>Có thể bán</th>
                  <th>Đã giữ</th>
                  <th>Đang có</th>
                  <th>Vị trí</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const levels = item.location_levels ?? []
                  return (
                    <tr key={item.id}>
                      <td><strong>{item.sku ?? "-"}</strong></td>
                      <td>{item.title ?? "-"}</td>
                      <td>{sum(levels, "available_quantity")}</td>
                      <td>{sum(levels, "reserved_quantity")}</td>
                      <td>{sum(levels, "stocked_quantity")}</td>
                      <td>
                        {levels
                          .map((level) => level.location?.name ?? level.location_id)
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => {
                            setInventoryItemId(item.id)
                            if (!locationId && levels[0]?.location_id) {
                              setLocationId(levels[0].location_id)
                            }
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                        >
                          Chọn
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            title="Chưa có mục tồn kho"
            description="Tồn kho xuất hiện khi variant được liên kết với Inventory Module."
          />
        )}
      </Panel>
    </div>
  )
}

function sum(
  levels: NonNullable<InventoryItem["location_levels"]>,
  key: "available_quantity" | "reserved_quantity" | "stocked_quantity",
) {
  return levels.reduce((total, level) => total + (level[key] ?? 0), 0)
}
