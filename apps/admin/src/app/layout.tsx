import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Hưng Phát Admin",
  description: "Trung tâm vận hành cửa hàng",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
