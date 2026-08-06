import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const vietQrEnabled = process.env.VIETQR_ENABLED === "true"

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/rbac",
    },
    {
      resolve: "./src/modules/security",
    },
    {
      resolve: "./src/modules/repair",
    },
    {
      resolve: "./src/modules/vietqr",
    },
    ...(vietQrEnabled
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: [
                {
                  resolve: "./src/modules/vietqr-provider",
                  id: "vietqr",
                  options: {
                    bank_bin: process.env.VIETQR_BANK_BIN,
                    account_number: process.env.VIETQR_ACCOUNT_NUMBER,
                    account_name: process.env.VIETQR_ACCOUNT_NAME,
                    confirmation_secret:
                      process.env.VIETQR_CONFIRMATION_SECRET,
                    expiry_minutes: Number(
                      process.env.VIETQR_EXPIRY_MINUTES ?? "30"
                    ),
                    qr_template:
                      process.env.VIETQR_QR_TEMPLATE ?? "compact2",
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
})
