import { promises as fs } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"

import type { Logger, NotificationTypes } from "@medusajs/framework/types"
import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"

export type NotificationSandboxOptions = {
  channels?: string[]
  origin: string
  outbox_path: string
  failure_mode?: boolean
}

type InjectedDependencies = {
  logger: Logger
}

const supportedTemplates = new Set([
  "password-reset",
  "password-reset-confirmation",
])

function asString(value: unknown) {
  return typeof value === "string" ? value : ""
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

class NotificationSandboxService extends AbstractNotificationProviderService {
  static identifier = "notification-sandbox"

  protected readonly options_: NotificationSandboxOptions
  protected readonly logger_: Logger

  constructor(
    { logger }: InjectedDependencies,
    options: NotificationSandboxOptions
  ) {
    super()
    this.options_ = options
    this.logger_ = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    const origin = asString(options.origin)
    const outboxPath = asString(options.outbox_path)

    try {
      const parsedOrigin = new URL(origin)
      if (!["http:", "https:"].includes(parsedOrigin.protocol)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Unsupported protocol"
        )
      }
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Notification sandbox origin must be an absolute HTTP(S) URL"
      )
    }

    if (!outboxPath) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Notification sandbox outbox_path is required"
      )
    }
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (
      !notification ||
      notification.channel !== "email" ||
      !notification.to ||
      !supportedTemplates.has(notification.template)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Unsupported notification request"
      )
    }

    if (this.options_.failure_mode) {
      this.logger_.error("Notification sandbox delivery failed")
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Notification delivery failed"
      )
    }

    const data = notification.data ?? {}
    const resetUrl = asString(data.reset_url)
    const expiresInMinutes =
      typeof data.expires_in_minutes === "number"
        ? data.expires_in_minutes
        : 15
    const isConfirmation =
      notification.template === "password-reset-confirmation"
    const subject = isConfirmation
      ? "Mật khẩu tài khoản đã được cập nhật"
      : "Đặt lại mật khẩu tài khoản"
    const text = isConfirmation
      ? "Mật khẩu tài khoản của bạn đã được cập nhật. Nếu bạn không thực hiện thao tác này, hãy liên hệ bộ phận hỗ trợ ngay."
      : [
          "Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
          resetUrl ? `Mở liên kết đặt lại mật khẩu: ${resetUrl}` : "",
          `Liên kết sẽ hết hạn sau khoảng ${expiresInMinutes} phút và chỉ dùng được một lần.`,
          "Nếu bạn không yêu cầu thao tác này, có thể bỏ qua email.",
        ]
          .filter(Boolean)
          .join("\n\n")
    const html = isConfirmation
      ? `<p>Mật khẩu tài khoản của bạn đã được cập nhật.</p><p>Nếu bạn không thực hiện thao tác này, hãy liên hệ bộ phận hỗ trợ ngay.</p>`
      : `<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>${
          resetUrl
            ? `<p><a href="${escapeHtml(resetUrl)}">Đặt lại mật khẩu</a></p>`
            : ""
        }<p>Liên kết sẽ hết hạn sau khoảng ${expiresInMinutes} phút và chỉ dùng được một lần.</p><p>Nếu bạn không yêu cầu thao tác này, có thể bỏ qua email.</p>`
    const id = `sandbox_${randomUUID()}`
    const record = {
      id,
      channel: notification.channel,
      template: notification.template,
      to: notification.to,
      from: notification.from ?? null,
      subject,
      text,
      html,
      created_at: new Date().toISOString(),
    }
    const outboxPath = path.resolve(process.cwd(), this.options_.outbox_path)
    const line = `${JSON.stringify(record)}\n`

    let lastError: unknown
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        await fs.mkdir(path.dirname(outboxPath), { recursive: true })
        await fs.appendFile(outboxPath, line, { encoding: "utf8" })
        lastError = undefined
        break
      } catch (error) {
        lastError = error
      }
    }

    if (lastError) {
      this.logger_.error("Notification sandbox delivery failed")
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Notification delivery failed"
      )
    }

    return { id }
  }
}

export default NotificationSandboxService
