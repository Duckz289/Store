import type { NextConfig } from "next"
import path from "node:path"

const backendUrl = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"

const nextConfig: NextConfig = {
  basePath: "/admin",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/medusa/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
