const MFA_RETURN_PATH_STORAGE_KEY = "medusa-admin-mfa-return-path"
const DEFAULT_MFA_RETURN_PATH = "/app/products"
const MFA_RETURN_PATH_TTL_MS = 30 * 60 * 1000

type StoredReturnPath = {
  path: string
  savedAt: number
}

const isSafeAdminPath = (
  path: string | null | undefined
): path is string => typeof path === "string" && /^\/app(?:\/|$)/.test(path)

export const rememberCurrentAdminPath = () => {
  if (typeof window === "undefined") {
    return
  }

  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (!isSafeAdminPath(path) || path.startsWith("/app/security/mfa")) {
    return
  }

  const value: StoredReturnPath = {
    path,
    savedAt: Date.now(),
  }

  window.sessionStorage.setItem(MFA_RETURN_PATH_STORAGE_KEY, JSON.stringify(value))
}

export const getMfaReturnPath = () => {
  if (typeof window === "undefined") {
    return DEFAULT_MFA_RETURN_PATH
  }

  const explicitPath = new URLSearchParams(window.location.search).get(
    "return_to"
  )
  if (isSafeAdminPath(explicitPath)) {
    return explicitPath
  }

  try {
    const rawValue = window.sessionStorage.getItem(MFA_RETURN_PATH_STORAGE_KEY)
    const value = rawValue ? (JSON.parse(rawValue) as StoredReturnPath) : undefined
    if (
      value &&
      isSafeAdminPath(value.path) &&
      Date.now() - value.savedAt <= MFA_RETURN_PATH_TTL_MS
    ) {
      return value.path
    }
  } catch {
    // A malformed or expired route must never affect a completed MFA step-up.
  }

  return DEFAULT_MFA_RETURN_PATH
}

export const clearMfaReturnPath = () => {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(MFA_RETURN_PATH_STORAGE_KEY)
  }
}
