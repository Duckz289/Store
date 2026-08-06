import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <section className="border-b border-[var(--hp-line)] bg-[var(--hp-paper)]">
      <div className="content-container grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--hp-accent)]">
            Điện Tử Hưng Phát
          </p>
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[var(--hp-ink)] sm:text-5xl sm:leading-[1.08]">
            Mua thiết bị tốt, hiểu rõ mình đang trả tiền cho điều gì.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--hp-muted)] sm:text-lg">
            Sản phẩm chính hãng, thông tin gọn và giá hiển thị minh bạch từ hệ
            thống. Chọn nhanh, nhận hàng thuận tiện, cần hỗ trợ vẫn có người
            đồng hành.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LocalizedClientLink
              href="/store"
              className="inline-flex h-11 items-center justify-center rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-5 text-sm font-bold text-white transition-colors hover:bg-[var(--hp-accent-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"
            >
              Xem sản phẩm
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/#repair"
              className="inline-flex h-11 items-center justify-center rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-[var(--hp-surface)] px-5 text-sm font-bold text-[var(--hp-ink)] transition-colors hover:border-[var(--hp-accent)] hover:text-[var(--hp-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-accent)] focus-visible:ring-offset-2"
            >
              Dịch vụ sửa chữa
            </LocalizedClientLink>
          </div>
        </div>

        <div className="relative min-h-[260px] overflow-hidden rounded-[var(--hp-radius-card)] bg-[var(--hp-accent)] p-6 text-white sm:min-h-[320px] sm:p-8">
          <div className="absolute -right-10 -top-12 h-48 w-48 rounded-full border-[28px] border-white/15" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full border-[30px] border-white/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-sm font-semibold text-white/75">Từ chọn hàng đến sau mua</p>
              <p className="mt-2 max-w-xs text-2xl font-extrabold leading-tight sm:text-3xl">
                Mọi thông tin quan trọng ở đúng chỗ.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
              {[
                ["01", "Giá rõ ràng"],
                ["02", "Thanh toán linh hoạt"],
                ["03", "Theo dõi dễ dàng"],
                ["04", "Có nơi sửa chữa"],
              ].map(([number, label]) => (
                <div
                  key={number}
                  className="rounded-[var(--hp-radius-control)] border border-white/20 bg-black/10 p-3"
                >
                  <span className="text-xs font-bold text-white/70">{number}</span>
                  <p className="mt-1 text-sm font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
