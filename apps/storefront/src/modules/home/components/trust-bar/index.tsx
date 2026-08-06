import { CreditCard, ShieldCheck, Tools, TruckFast } from "@medusajs/icons"

const trustItems = [
  [ShieldCheck, "Hàng chính hãng", "Cam kết nguồn gốc rõ ràng"],
  [TruckFast, "Giao hàng toàn quốc", "Theo dõi trạng thái từng bước"],
  [Tools, "Bảo hành minh bạch", "Thông tin và thời hạn rõ ràng"],
  [CreditCard, "COD và VietQR", "Thanh toán linh hoạt, an toàn"],
] as const

const TrustBar = () => (
  <section className="border-y border-[var(--hp-line)] bg-[var(--hp-surface)]" aria-label="Cam kết dịch vụ">
    <div className="content-container grid divide-y divide-[var(--hp-line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      {trustItems.map(([Icon, title, description]) => (
        <div key={title} className="flex items-center gap-3 py-5 sm:px-5 lg:first:pl-0 lg:last:pr-0">
          <Icon className="h-7 w-7 shrink-0 text-[var(--hp-accent)]" />
          <div>
            <p className="text-sm font-semibold leading-5 text-[var(--hp-ink)]">{title}</p>
            <p className="mt-1 text-[13px] font-normal leading-5 text-[var(--hp-muted)]">{description}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
)

export default TrustBar
