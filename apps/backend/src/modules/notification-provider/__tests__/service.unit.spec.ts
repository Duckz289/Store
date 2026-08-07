import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

import NotificationSandboxService from "../service"

function createLogger() {
  return {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as any
}

describe("NotificationSandboxService", () => {
  it("writes a reset message without logging the token", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "notification-"))
    const logger = createLogger()
    const service = new NotificationSandboxService(
      { logger },
      {
        origin: "http://localhost:8010",
        outbox_path: path.join(directory, "outbox.jsonl"),
      }
    )

    await service.send({
      to: "customer@example.test",
      channel: "email",
      template: "password-reset",
      data: {
        reset_url: "http://localhost:8010/vn/account/reset-password?token=secret-token",
        expires_in_minutes: 15,
      },
    })

    const output = await fs.readFile(path.join(directory, "outbox.jsonl"), "utf8")

    expect(output).toContain("password-reset")
    expect(output).toContain("secret-token")
    expect(logger.error).not.toHaveBeenCalled()
  })

  it("rejects unsupported templates and reports provider failure generically", async () => {
    const logger = createLogger()
    const service = new NotificationSandboxService(
      { logger },
      {
        origin: "http://localhost:8010",
        outbox_path: path.join(os.tmpdir(), "notification-invalid", "outbox.jsonl"),
        failure_mode: true,
      }
    )

    await expect(
      service.send({
        to: "customer@example.test",
        channel: "email",
        template: "unsupported",
        data: {},
      })
    ).rejects.toThrow("Unsupported notification request")

    await expect(
      service.send({
        to: "customer@example.test",
        channel: "email",
        template: "password-reset",
        data: { reset_url: "https://example.test/reset?token=secret-token" },
      })
    ).rejects.toThrow("Notification delivery failed")
    expect(logger.error).toHaveBeenCalledWith(
      "Notification sandbox delivery failed"
    )
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain("secret-token")
  })
})
