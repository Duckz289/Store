import Link from "next/link"
import type { ReactNode } from "react"

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {action ? <div className="page-actions">{action}</div> : null}
    </header>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`panel ${className}`}>
      {title || description || action ? (
        <div className="panel-header">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = value?.toLowerCase() ?? ""
  const tone = ["completed", "captured", "fulfilled", "active", "approved", "success", "closed", "returned"].includes(normalized)
    ? "success"
    : ["canceled", "cancelled", "failed", "rejected", "error"].includes(normalized)
      ? "danger"
      : ["pending", "awaiting", "intake", "diagnosis", "quote", "repair", "quality_assurance", "requires_action"].includes(normalized)
        ? "warning"
        : "neutral"
  return <Badge tone={tone}>{value?.replaceAll("_", " ") || "-"}</Badge>
}

export function ButtonLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link className={`button ${secondary ? "button-secondary" : ""}`} href={href}>{children}</Link>
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return <div className="state-block" aria-live="polite"><div className="skeleton skeleton-title" />{Array.from({ length: rows }).map((_, index) => <div className="skeleton" key={index} />)}</div>
}

export function ErrorState({ error }: { error: unknown }) {
  return <div className="state-block state-error"><strong>Không thể tải dữ liệu</strong><span>{error instanceof Error ? error.message : "Vui lòng thử lại."}</span></div>
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="state-block state-empty"><strong>{title}</strong><span>{description}</span>{action}</div>
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="table-wrap">{children}</div>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="detail-row"><span>{label}</span><strong>{children}</strong></div>
}
