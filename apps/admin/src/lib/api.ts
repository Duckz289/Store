import { sdk } from "@/lib/sdk"

export async function adminFetch<T>(
  path: string,
  init?: { method?: string; body?: unknown },
) {
  return sdk.client.fetch<T>(path, init as never)
}

export function queryString(
  values: Record<string, string | number | string[] | undefined>,
) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => params.append(`${key}[]`, item))
    } else if (value !== undefined && value !== "") {
      params.set(key, String(value))
    }
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}
