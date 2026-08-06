import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Be_Vietnam_Pro } from "next/font/google"
import "styles/globals.css"

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Segoe UI", "Arial", "sans-serif"],
  variable: "--font-be-vietnam-pro",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Điện Tử Hưng Phát",
    template: "%s | Điện Tử Hưng Phát",
  },
  description:
    "Mua thiết bị điện tử chính hãng với giá rõ ràng và hỗ trợ sau mua tận tâm.",
  applicationName: "Điện Tử Hưng Phát",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-mode="light">
      <body className={`${beVietnamPro.className} ${beVietnamPro.variable}`}>
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded-[var(--hp-radius-control)] bg-[var(--hp-ink)] px-4 py-3 text-sm font-semibold text-white focus:not-sr-only"
        >
          Chuyển tới nội dung chính
        </a>
        <main className="relative min-h-screen">{props.children}</main>
      </body>
    </html>
  )
}
