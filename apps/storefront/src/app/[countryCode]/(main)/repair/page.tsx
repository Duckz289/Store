import { Metadata } from "next"

import RepairIntakeForm from "@modules/repair/components/repair-intake-form"

export const metadata: Metadata = {
  title: "Đăng ký sửa chữa",
  description:
    "Gửi thông tin thiết bị và hình ảnh để Điện Tử Hưng Phát tiếp nhận, chẩn đoán và báo giá.",
}

const steps = [
  ["01", "Tiếp nhận", "Ghi nhận thiết bị, tình trạng và hình ảnh ban đầu."],
  ["02", "Chẩn đoán", "Kỹ thuật viên kiểm tra nguyên nhân và phương án xử lý."],
  ["03", "Báo giá", "Báo giá được gửi vào Hòm báo giá để bạn kiểm tra."],
  ["04", "Bàn giao", "Theo dõi chất lượng và thời điểm nhận lại thiết bị."],
]

export default function RepairPage() {
  return (
    <main className="bg-[var(--hp-paper)]">
      <section className="content-container py-10 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div className="lg:sticky lg:top-32">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--hp-accent)]">
              Hỗ trợ sau mua
            </p>
            <h1 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[var(--hp-ink)] sm:text-5xl">
              Gửi yêu cầu sửa chữa trong vài phút.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--hp-muted)]">
              Mô tả thiết bị và lỗi đang gặp. Hình ảnh rõ sẽ giúp kỹ thuật viên
              chẩn đoán và báo giá nhanh hơn.
            </p>
            <div className="mt-7 border-l-2 border-[var(--hp-accent)] pl-4 text-sm leading-6 text-[var(--hp-muted)]">
              Sau khi gửi, bạn sẽ nhận một mã hồ sơ. Dùng mã này cùng số điện
              thoại tại{" "}
              <strong className="text-[var(--hp-ink)]">Hòm báo giá</strong> để
              theo dõi.
            </div>
          </div>

          <RepairIntakeForm />
        </div>
      </section>

      <section className="border-y border-[var(--hp-line)] bg-[var(--hp-surface)]">
        <div className="content-container grid divide-y divide-[var(--hp-line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {steps.map(([number, title, description]) => (
            <div
              key={number}
              className="px-0 py-6 sm:px-5 lg:first:pl-0 lg:last:pr-0"
            >
              <span className="text-xs font-bold text-[var(--hp-accent)]">
                {number}
              </span>
              <h2 className="mt-3 text-base font-bold text-[var(--hp-ink)]">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--hp-muted)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
