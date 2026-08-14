import { Metadata } from "next"

import RepairQuoteInbox from "@modules/repair/components/repair-quote-inbox"

export const metadata: Metadata = {
  title: "Hòm báo giá sửa chữa",
  description: "Tra cứu trạng thái hồ sơ và báo giá sửa chữa của bạn.",
}

export default function RepairInboxPage() {
  return (
    <main className="bg-[var(--hp-paper)] py-10 sm:py-16">
      <div className="content-container">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hp-accent)]">
            Sửa chữa
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--hp-ink)] sm:text-4xl">
            Hòm báo giá
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--hp-muted)]">
            Nhập mã hồ sơ và số điện thoại đã đăng ký để xem trạng thái cùng báo
            giá mới nhất.
          </p>
          <RepairQuoteInbox />
        </div>
      </div>
    </main>
  )
}
