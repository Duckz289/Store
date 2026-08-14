import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

export type ListResponse<T, K extends string> = Record<K, T[]> & {
  count: number
  limit: number
  offset: number
}

export const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-"

export const formatMoney = (amount?: number | string | null, currency = "VND") => {
  if (amount === null || amount === undefined || amount === "") return "-"

  const numericAmount = Number(amount)
  if (Number.isNaN(numericAmount)) return "-"

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: currency.toUpperCase() === "VND" ? 0 : 2,
  }).format(numericAmount)
}

export const titleFromStatus = (value?: string | null) =>
  value ? value.replace(/_/g, " ") : "-"

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) => (
  <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
    <div className="grid gap-1">
      <Heading level="h1">{title}</Heading>
      <Text className="max-w-3xl text-ui-fg-subtle">{description}</Text>
    </div>
    {action}
  </div>
)

export const PageContainer = ({ children }: { children: ReactNode }) => (
  <Container className="overflow-hidden p-0">{children}</Container>
)

export const LoadingState = () => (
  <div className="grid gap-3 px-6 py-5" aria-live="polite">
    <div className="h-5 w-40 animate-pulse rounded bg-ui-bg-component" />
    <div className="h-4 w-full animate-pulse rounded bg-ui-bg-component" />
    <div className="h-4 w-4/5 animate-pulse rounded bg-ui-bg-component" />
  </div>
)

export const ErrorState = ({ error }: { error: unknown }) => (
  <div className="px-6 py-5">
    <Text className="text-ui-fg-error">
      {error instanceof Error ? error.message : "Không thể tải dữ liệu."}
    </Text>
  </div>
)

export const EmptyState = ({
  title,
  description,
  href,
  action,
}: {
  title: string
  description: string
  href?: string
  action?: string
}) => (
  <div className="grid justify-items-start gap-2 px-6 py-10">
    <Text weight="plus">{title}</Text>
    <Text className="text-ui-fg-subtle">{description}</Text>
    {href && action ? (
      <Button variant="secondary" size="small" asChild>
        <Link to={href}>{action}</Link>
      </Button>
    ) : null}
  </div>
)

export const StatusBadge = ({ value }: { value?: string | null }) => (
  <Badge>{titleFromStatus(value)}</Badge>
)

export const NativeLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link className="text-ui-fg-interactive hover:underline" to={to}>
    {children}
  </Link>
)
