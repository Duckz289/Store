import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { SYSTEM_OWNER_ROLE } from "../../utils/role-matrix"
import { listRequestTraces } from "../../utils/request-trace"

type HealthStatus = "pass" | "warn" | "fail"

type HealthCheck = {
  id: string
  label: string
  status: HealthStatus
  critical: boolean
  latency_ms: number
  message: string
  details?: Record<string, unknown>
}

async function runCheck(
  id: string,
  label: string,
  critical: boolean,
  check: () => Promise<{
    status?: HealthStatus
    message: string
    details?: Record<string, unknown>
  }>
): Promise<HealthCheck> {
  const startedAt = Date.now()
  try {
    const result = await check()
    return {
      id,
      label,
      critical,
      latency_ms: Date.now() - startedAt,
      status: result.status ?? "pass",
      message: result.message,
      details: result.details,
    }
  } catch (error) {
    return {
      id,
      label,
      critical,
      latency_ms: Date.now() - startedAt,
      status: "fail",
      message: error instanceof Error ? error.message : "Health check failed",
    }
  }
}

const getSystemHealthStep = createStep(
  "get-system-health",
  async (_, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const checks = await Promise.all([
      runCheck("database", "Cơ sở dữ liệu", true, async () => {
        const { data } = await query.graph({
          entity: "store",
          fields: ["id"],
        })
        return {
          message: "Kết nối module dữ liệu thành công",
          details: { stores: data.length },
        }
      }),
      runCheck("commerce", "Cấu hình bán hàng", true, async () => {
        const [{ data: stores }, { data: locations }, { data: regions }] =
          await Promise.all([
            query.graph({
              entity: "store",
              fields: ["id", "default_sales_channel_id"],
            }),
            query.graph({
              entity: "stock_location",
              fields: ["id", "sales_channels.id"],
            }),
            query.graph({ entity: "region", fields: ["id"] }),
          ])
        const defaultChannel = stores.some(
          (store) => Boolean(store.default_sales_channel_id)
        )
        const linkedLocation = locations.some(
          (location) => Boolean(location.sales_channels?.length)
        )
        const ready = defaultChannel && linkedLocation && regions.length > 0
        return {
          status: ready ? "pass" : "fail",
          message: ready
            ? "Kênh bán, vùng và kho đã liên kết"
            : "Thiếu kênh bán mặc định, vùng hoặc liên kết kho",
          details: {
            default_sales_channel: defaultChannel,
            linked_stock_location: linkedLocation,
            regions: regions.length,
          },
        }
      }),
      runCheck("system_owner", "System Owner", true, async () => {
        const { data } = await query.graph({
          entity: "user",
          fields: ["id", "rbac_roles.name"],
        })
        const count = data.filter((user) =>
          user.rbac_roles?.some((role) => role?.name === SYSTEM_OWNER_ROLE)
        ).length
        return {
          status: count === 1 ? "pass" : "fail",
          message:
            count === 1
              ? "Đúng một tài khoản System Owner"
              : `Phát hiện ${count} tài khoản System Owner`,
          details: { count },
        }
      }),
      runCheck("audit", "Audit log", false, async () => {
        const [, count] = await securityService.listAndCountAuditEvents(
          {},
          { take: 1 }
        )
        return {
          message: "Kho audit có thể đọc và xác minh",
          details: { event_count: count },
        }
      }),
      runCheck("security_config", "Cấu hình bảo mật", false, async () => {
        const configured = [
          process.env.JWT_SECRET,
          process.env.COOKIE_SECRET,
          process.env.AUTH_MFA_ENCRYPTION_KEY,
        ].every(
          (value) =>
            Boolean(value?.trim()) && !value?.toLowerCase().includes("replace")
        )
        return {
          status: configured ? "pass" : "warn",
          message: configured
            ? "Các khóa bắt buộc đã được cấu hình"
            : "Một hoặc nhiều khóa vẫn thiếu hoặc dùng giá trị mẫu",
        }
      }),
    ])
    const failedCritical = checks.some(
      (check) => check.critical && check.status === "fail"
    )
    const hasWarning = checks.some((check) => check.status !== "pass")
    const recentAudit = await securityService.listAuditEvents(
      {},
      { order: { occurred_at: "DESC" }, take: 20 }
    )

    return new StepResponse({
      status: failedCritical
        ? "unhealthy"
        : hasWarning
          ? "degraded"
          : "healthy",
      checked_at: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      memory: {
        rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heap_used_mb: Math.round(
          process.memoryUsage().heapUsed / 1024 / 1024
        ),
      },
      checks,
      traces: listRequestTraces(50),
      recent_audit: recentAudit.map((event) => ({
        id: event.id,
        correlation_id: event.correlation_id,
        action: event.action,
        resource_type: event.resource_type,
        outcome: event.outcome,
        status_code: event.status_code,
        occurred_at: event.occurred_at,
      })),
    })
  }
)

export const getSystemHealthWorkflow = createWorkflow(
  "get-system-health",
  () => new WorkflowResponse(getSystemHealthStep())
)
