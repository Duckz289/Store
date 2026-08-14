"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"

import {
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Panel,
  StatusBadge,
  TableWrap,
} from "@/components/ui"
import { adminFetch } from "@/lib/api"
import { formatDate, formatMoney } from "@/lib/format"
import type { Promotion } from "@/lib/types"

export default function PromotionsPage() {
  const [tab, setTab] = useState("all")
  const query = useQuery({
    queryKey: ["promotions"],
    queryFn: () =>
      adminFetch<{ promotions: Promotion[]; count: number }>(
        "/admin/promotions?limit=100&order=-created_at&fields=+campaign.*",
      ),
  })
  const items =
    query.data?.promotions.filter(
      (promotion) =>
        tab === "all" ||
        (tab === "coupon" ? Boolean(promotion.code) : !promotion.code),
    ) ?? []
  return (
    <div className="stack">
      <PageHeader
        eyebrow="Tăng trưởng"
        title="Khuyến mãi"
        description="Quản lý chương trình sale tự động và coupon."
        action={<ButtonLink href="/promotions/new">Tạo khuyến mãi</ButtonLink>}
      />
      <Panel>
        <div className="toolbar">
          <select value={tab} onChange={(event) => setTab(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="sale">Sale</option>
            <option value="coupon">Coupon</option>
          </select>
          <span className="toolbar-spacer">{items.length} chương trình</span>
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
                  <th>Mã / tên</th>
                  <th>Loại</th>
                  <th>Giá trị</th>
                  <th>Trạng thái</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                </tr>
              </thead>
              <tbody>
                {items.map((promotion) => (
                  <tr key={promotion.id}>
                    <td>
                      <Link
                        className="table-link"
                        href={`/promotions/${promotion.id}`}
                      >
                        {promotion.code ||
                          promotion.campaign?.name ||
                          promotion.id.slice(-8)}
                      </Link>
                    </td>
                    <td>
                      {promotion.application_method?.type === "percentage"
                        ? "Phần trăm"
                        : "Số tiền"}
                    </td>
                    <td>
                      {promotion.application_method?.type === "percentage"
                        ? `${promotion.application_method.value ?? "-"}%`
                        : formatMoney(
                            promotion.application_method?.value,
                            promotion.application_method?.currency_code ??
                              "VND",
                          )}
                    </td>
                    <td>
                      <StatusBadge value={promotion.status} />
                    </td>
                    <td>
                      {formatDate(
                        promotion.campaign?.starts_at ?? promotion.starts_at,
                      )}
                    </td>
                    <td>
                      {formatDate(
                        promotion.campaign?.ends_at ?? promotion.ends_at,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState
            title="Chưa có khuyến mãi"
            description="Tạo sale hoặc coupon đầu tiên."
            action={
              <ButtonLink href="/promotions/new">Tạo khuyến mãi</ButtonLink>
            }
          />
        )}
      </Panel>
    </div>
  )
}
