import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Dịch vụ sửa chữa",
  description:
    "Theo dõi hồ sơ sửa chữa thiết bị với quy trình rõ ràng và thông tin vừa đủ.",
}

const steps = [
  ["01", "Tiếp nhận", "Ghi nhận thiết bị và tình trạng ban đầu."],
  ["02", "Chẩn đoán", "Kỹ thuật viên cập nhật nguyên nhân và phương án."],
  ["03", "Báo giá", "Bạn xem, duyệt hoặc từ chối từng báo giá."],
  ["04", "Bàn giao", "Theo dõi kiểm tra chất lượng và thời điểm nhận lại."],
]

export default function RepairPage() {
  return (
    <main className="bg-[var(--hp-paper)]">
      <section className="content-container py-12 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hp-accent)]">
          Hỗ trợ sau mua
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[var(--hp-ink)] sm:text-5xl">
          Sửa chữa minh bạch, từ lúc tiếp nhận đến khi bàn giao.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--hp-muted)]">
          Dịch vụ sửa chữa là một hồ sơ độc lập với đơn mua hàng. Mỗi bước có
          trạng thái, người phụ trách và lịch sử cập nhật riêng.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LocalizedClientLink
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-5 text-sm font-bold text-white hover:bg-[var(--hp-accent-strong)]"
          >
            Quay lại mua sắm
          </LocalizedClientLink>
          <span className="inline-flex h-11 items-center rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-5 text-sm font-semibold text-[var(--hp-muted)]">
            Tra cứu hồ sơ sẽ được kết nối trong bước tiếp theo
          </span>
        </div>
      </section>

      <section className="border-y border-[var(--hp-line)] bg-[var(--hp-surface)]">
        <div className="content-container grid divide-y divide-[var(--hp-line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {steps.map(([number, title, description]) => (
            <div key={number} className="px-0 py-6 sm:px-5 lg:first:pl-0 lg:last:pr-0">
              <span className="text-xs font-bold text-[var(--hp-accent)]">{number}</span>
              <h2 className="mt-3 text-base font-bold text-[var(--hp-ink)]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--hp-muted)]">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
