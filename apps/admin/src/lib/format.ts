export const formatDate = (value?: string | Date | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "-"

export const formatMoney = (
  value?: number | string | null,
  currency = "VND"
) => {
  if (value === undefined || value === null || value === "") return "-"
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "-"

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: currency.toUpperCase() === "VND" ? 0 : 2,
  }).format(amount)
}

export const humanize = (value?: string | null) =>
  value ? value.replaceAll("_", " ") : "-"

export const maskPhone = (value?: string | null) => {
  if (!value) return "-"
  if (value.length < 6) return "***"
  return `${value.slice(0, 3)}${"*".repeat(Math.max(3, value.length - 5))}${value.slice(-2)}`
}
