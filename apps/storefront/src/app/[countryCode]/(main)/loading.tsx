const Loading = () => (
  <div className="content-container py-8 lg:py-10" aria-label="Đang tải nội dung">
    <div className="mb-6 h-8 w-56 animate-pulse rounded-[8px] bg-[var(--hp-line)]" />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-4">
          <div className="aspect-[4/3] animate-pulse rounded-[8px] bg-[var(--hp-paper)]" />
          <div className="mt-4 h-5 w-4/5 animate-pulse rounded bg-[var(--hp-paper)]" />
          <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-[var(--hp-paper)]" />
          <div className="mt-5 h-6 w-2/5 animate-pulse rounded bg-[var(--hp-paper)]" />
        </div>
      ))}
    </div>
  </div>
)

export default Loading
