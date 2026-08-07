import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listCustomerOrdersPage } from "@lib/data/orders"
import Divider from "@modules/common/components/divider"
import TransferRequestForm from "@modules/account/components/transfer-request-form"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const requestedPage = Number(page)
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const limit = 10
  const { orders, count } = await listCustomerOrdersPage(
    limit,
    (currentPage - 1) * limit
  )

  if (!orders) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="type-section-title">Đơn hàng của tôi</h1>
        <p className="type-body text-[var(--hp-muted)]">
          Xem trạng thái thanh toán, giao hàng và chi tiết các đơn thuộc tài khoản của bạn.
        </p>
      </div>
      <div>
        <OrderOverview orders={orders} />
        {count > limit && (
          <nav className="mt-7 flex items-center justify-between gap-4 border-t border-[var(--hp-line)] pt-5" aria-label="Phân trang đơn hàng">
            {currentPage > 1 ? (
              <LocalizedClientLink
                href={`/account/orders?page=${currentPage - 1}`}
                className="type-header-label rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] px-4 py-2 hover:border-[var(--hp-accent)]"
              >
                Trang trước
              </LocalizedClientLink>
            ) : (
              <span />
            )}
            <span className="type-header-label text-[var(--hp-muted)]">
              Trang {currentPage} / {Math.ceil(count / limit)}
            </span>
            {currentPage * limit < count ? (
              <LocalizedClientLink
                href={`/account/orders?page=${currentPage + 1}`}
                className="type-header-label rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] px-4 py-2 hover:border-[var(--hp-accent)]"
              >
                Trang sau
              </LocalizedClientLink>
            ) : (
              <span />
            )}
          </nav>
        )}
        <Divider className="mb-8 mt-8" />
        <TransferRequestForm />
      </div>
    </div>
  )
}
