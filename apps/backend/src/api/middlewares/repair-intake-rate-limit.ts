import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

const WINDOW_MS = 15 * 60 * 1000
const requests = new Map<string, number[]>()

export function repairIntakeRateLimit(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const forwarded = req.headers["x-forwarded-for"]
  const address = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(",")[0]
  const key = `${req.path}:${address || req.ip || "unknown"}`
  const now = Date.now()
  const recent = (requests.get(key) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  )
  const maximum = req.path.includes("repair-uploads") ? 25 : 10

  if (recent.length >= maximum) {
    res.status(429).json({
      type: "rate_limit_error",
      message: "Too many repair requests. Please try again later.",
    })
    return
  }

  recent.push(now)
  requests.set(key, recent)
  next()
}
