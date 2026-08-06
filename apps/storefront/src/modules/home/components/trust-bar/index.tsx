const trustItems = [
  ["01", "Giá từ hệ thống", "Thông tin giá và tiền tệ theo khu vực"],
  ["02", "COD và VietQR", "Chọn cách thanh toán phù hợp"],
  ["03", "Theo dõi đơn", "Trạng thái rõ ràng sau khi đặt"],
  ["04", "Sửa chữa có mã", "Tra cứu hồ sơ bằng thông tin tối thiểu"],
]

const TrustBar = () => (
  <section className="border-y border-[var(--hp-line)] bg-[var(--hp-surface)]" aria-label="Cam kết dịch vụ">
    <div className="content-container grid divide-y divide-[var(--hp-line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      {trustItems.map(([number, title, description]) => (
        <div key={number} className="flex gap-3 py-5 sm:px-5 lg:first:pl-0 lg:last:pr-0">
          <span className="text-xs font-bold text-[var(--hp-accent)]">{number}</span>
          <div>
            <p className="text-sm font-bold text-[var(--hp-ink)]">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--hp-muted)]">{description}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)

export default TrustBar
