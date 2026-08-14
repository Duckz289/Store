import Medusa from "@medusajs/js-sdk"

const getBackendUrl = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/admin/api/medusa`
  }

  return process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"
}

export const sdk = new Medusa({
  baseUrl: getBackendUrl(),
  debug: false,
  auth: { type: "session" },
})
