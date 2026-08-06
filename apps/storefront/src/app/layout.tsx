import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"

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
      <body>
        <main className="relative min-h-screen">{props.children}</main>
      </body>
    </html>
  )
}
