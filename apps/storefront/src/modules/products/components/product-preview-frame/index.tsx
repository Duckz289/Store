"use client"

import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"

type PreviewMode = "pdp" | "card"
type PreviewViewport = "desktop" | "mobile"

const ProductPreviewFrame = ({ token }: { token: string }) => {
  const pathname = usePathname()
  const [mode, setMode] = useState<PreviewMode>("pdp")
  const [viewport, setViewport] = useState<PreviewViewport>("desktop")
  const source = useMemo(
    () =>
      `${pathname}/render?token=${encodeURIComponent(token)}&mode=${mode}`,
    [mode, pathname, token]
  )

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Product preview
            </p>
            <p className="text-xs text-slate-500">
              Read-only saved data. This link expires shortly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["pdp", "card"] as PreviewMode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  mode === value
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {value === "pdp" ? "PDP" : "Product Card"}
              </button>
            ))}
            {(["desktop", "mobile"] as PreviewViewport[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setViewport(value)}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  viewport === value
                    ? "bg-[var(--hp-accent)] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                {value === "desktop" ? "Desktop" : "Mobile"}
              </button>
            ))}
          </div>
        </div>
        <div
          className={`mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl transition-[max-width] ${
            viewport === "mobile" ? "max-w-[390px]" : "max-w-full"
          }`}
        >
          <iframe
            key={source}
            src={source}
            title="Storefront product preview"
            className="h-[calc(100vh-150px)] min-h-[680px] w-full"
            sandbox="allow-same-origin allow-scripts"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </main>
  )
}

export default ProductPreviewFrame
