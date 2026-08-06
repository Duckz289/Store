"use client"

const Error = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => (
  <div className="content-container py-16">
    <section className="mx-auto max-w-xl rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-8 text-center" role="alert">
      <h1 className="text-2xl font-bold text-[var(--hp-ink)]">Không thể tải nội dung</h1>
      <p className="mt-3 text-sm leading-6 text-[var(--hp-muted)]">Kết nối dữ liệu sản phẩm đang gặp sự cố tạm thời. Vui lòng thử lại.</p>
      <button type="button" onClick={reset} className="mt-6 h-11 rounded-[var(--hp-radius-control)] bg-[var(--hp-accent)] px-5 text-sm font-semibold text-white hover:bg-[var(--hp-accent-strong)]">Thử lại</button>
    </section>
  </div>
)

export default Error
