"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Theme } from "@astryxdesign/core/theme"
import { neutralTheme } from "@astryxdesign/theme-neutral/built"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  )

  return <Theme theme={neutralTheme}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></Theme>
}
