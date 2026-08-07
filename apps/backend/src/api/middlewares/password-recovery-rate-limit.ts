import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5
const requests = new Map<string, number[]>()

function getClientKey(req: MedusaRequest) {
  const forwarded = req.headers["x-forwarded-for"]
  const address = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0]

  return `${req.path}:${address || req.ip || "unknown"}`
}

export function passwordRecoveryRateLimit(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const now = Date.now()
  const key = getClientKey(req)
  const recent = (requests.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  )

  if (recent.length >= MAX_REQUESTS) {
    res.status(429).json({
      type: "rate_limit_error",
      message: "Too many password recovery requests",
    })
    return
  }

  recent.push(now)
  requests.set(key, recent)
  next()
}
