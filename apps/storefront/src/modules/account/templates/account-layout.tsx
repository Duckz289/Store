import React from "react"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <main className="flex-1 py-6 sm:py-10" data-testid="account-page">
      <div className="content-container">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
          {customer && (
            <aside className="rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-4 lg:h-fit lg:p-5">
              <AccountNav customer={customer} />
            </aside>
          )}
          <div className="min-w-0 rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-5 sm:p-7">
            {children}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-[var(--hp-muted)]">
            Cần hỗ trợ đơn hàng hoặc sửa chữa? Đội ngũ chăm sóc khách hàng luôn sẵn sàng.
          </p>
          <LocalizedClientLink
            href="/repair"
            className="type-header-label shrink-0 text-[var(--hp-accent)] hover:underline"
          >
            Tra cứu sửa chữa
          </LocalizedClientLink>
        </div>
      </div>
    </main>
  )
}

export default AccountLayout
