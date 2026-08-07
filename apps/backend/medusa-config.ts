import { defineConfig, loadEnv, MedusaError } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const vietQrEnabled = process.env.VIETQR_ENABLED === "true"
const notificationProvider = process.env.NOTIFICATION_PROVIDER ?? "sandbox"

if (!["sandbox", "sendgrid"].includes(notificationProvider)) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "NOTIFICATION_PROVIDER must be sandbox or sendgrid"
  )
}

if (
  notificationProvider === "sendgrid" &&
  (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM)
) {
  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "SENDGRID_API_KEY and SENDGRID_FROM are required for the sendgrid provider"
  )
}

const notificationProviderConfig =
  notificationProvider === "sendgrid"
    ? {
        resolve: "@medusajs/medusa/notification-sendgrid",
        id: "sendgrid",
        options: {
          channels: ["email"],
          api_key: process.env.SENDGRID_API_KEY,
          from: process.env.SENDGRID_FROM,
        },
      }
    : {
        resolve: "./src/modules/notification-provider",
        id: "sandbox",
        options: {
          channels: ["email"],
          origin: process.env.STOREFRONT_URL,
          outbox_path:
            process.env.NOTIFICATION_OUTBOX_PATH ??
            ".local/notification-outbox.jsonl",
          failure_mode: process.env.NOTIFICATION_SANDBOX_FAILURE === "true",
        },
      }

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
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [notificationProviderConfig],
      },
    },
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
