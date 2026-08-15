import type { Logger } from "@medusajs/framework/types"

export type RequestTrace = {
  correlation_id: string
  method: string
  path: string
  status_code: number
  duration_ms: number
  actor_id: string | null
  occurred_at: string
}

const MAX_TRACES = 250
const traces: RequestTrace[] = []

export function appendRequestTrace(trace: RequestTrace, logger?: Logger) {
  traces.unshift(trace)
  if (traces.length > MAX_TRACES) {
    traces.length = MAX_TRACES
  }

  if (trace.status_code >= 500) {
    logger?.error(JSON.stringify({ event: "http.request", ...trace }))
  } else if (trace.status_code >= 400 || trace.duration_ms >= 1_000) {
    logger?.warn(JSON.stringify({ event: "http.request", ...trace }))
  }
}

export function listRequestTraces(limit = 50) {
  return traces.slice(0, Math.min(Math.max(limit, 1), 100))
}
