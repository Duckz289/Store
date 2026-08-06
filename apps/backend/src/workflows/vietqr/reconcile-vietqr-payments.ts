import type { IPaymentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { VIETQR_MODULE } from "../../modules/vietqr"
import VietQrModuleService from "../../modules/vietqr/service"
import { prepareAuditEvent } from "../../utils/security-audit"
import {
  asVietQrPaymentData,
  hashVietQrCommand,
  hasValidIntent,
  normalizeVndAmount,
  VIETQR_PROVIDER_ID,
} from "../../utils/vietqr-payment"

type Finding = {
  payment_session_id: string
  order_id: string | null
  issue_type:
    | "expired_pending"
    | "exact_without_capture"
    | "amount_currency_mismatch"
    | "duplicate_bank_transaction"
    | "capture_without_observation"
    | "refund_without_receipt"
    | "intent_integrity"
  discriminator: string
  details: Record<string, unknown>
}

const reconcileVietQrPaymentsStep = createStep(
  "reconcile-viet-qr-payments",
  async (_, { container }) => {
    const paymentService = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )
    const vietQrService = container.resolve<VietQrModuleService>(VIETQR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const secret = process.env.VIETQR_CONFIRMATION_SECRET ?? ""
    const findings: Finding[] = []
    const sessions = await paymentService.listPaymentSessions({
      provider_id: VIETQR_PROVIDER_ID,
    })

    for (const item of sessions) {
      const session = await paymentService.retrievePaymentSession(item.id, {
        relations: ["payment", "payment.captures", "payment.refunds"],
      })
      const data = asVietQrPaymentData(session.data)
      const observations =
        await vietQrService.listVietQrTransferObservations({
          payment_session_id: session.id,
        })
      const exact = observations.find(
        (observation) => observation.outcome === "exact"
      )
      const captured = Boolean(
        session.payment?.captured_at || session.payment?.captures?.length
      )

      if (!secret || !hasValidIntent(secret, data)) {
        findings.push({
          payment_session_id: session.id,
          order_id: exact?.order_id ?? null,
          issue_type: "intent_integrity",
          discriminator: "intent",
          details: { schema_version: data.schema_version ?? null },
        })
      }
      if (
        (session.status === "pending" ||
          session.status === "pending_authorization") &&
        data.expires_at &&
        new Date(data.expires_at) < new Date()
      ) {
        findings.push({
          payment_session_id: session.id,
          order_id: exact?.order_id ?? null,
          issue_type: "expired_pending",
          discriminator: "expiry",
          details: { expires_at: data.expires_at },
        })
      }
      if (
        data.expected_amount &&
        (normalizeVndAmount(session.amount) !== data.expected_amount ||
          session.currency_code.toLowerCase() !== data.currency_code)
      ) {
        findings.push({
          payment_session_id: session.id,
          order_id: exact?.order_id ?? null,
          issue_type: "amount_currency_mismatch",
          discriminator: "session",
          details: {
            session_amount: normalizeVndAmount(session.amount),
            intent_amount: data.expected_amount,
            session_currency: session.currency_code,
            intent_currency: data.currency_code,
          },
        })
      }
      if (exact && !captured) {
        findings.push({
          payment_session_id: session.id,
          order_id: exact.order_id,
          issue_type: "exact_without_capture",
          discriminator: exact.id,
          details: { observation_id: exact.id },
        })
      }
      if (captured && !exact) {
        findings.push({
          payment_session_id: session.id,
          order_id: null,
          issue_type: "capture_without_observation",
          discriminator: session.payment?.id ?? "payment",
          details: { payment_id: session.payment?.id ?? null },
        })
      }
      if (session.payment?.refunds?.length) {
        const manualRefunds = await vietQrService.listVietQrManualRefunds({
          payment_id: session.payment.id,
        })
        const linkedRefundIds = new Set(
          manualRefunds
            .map((refund) => refund.medusa_refund_id)
            .filter((id): id is string => Boolean(id))
        )
        for (const refund of session.payment.refunds) {
          if (!linkedRefundIds.has(refund.id)) {
            findings.push({
              payment_session_id: session.id,
              order_id: exact?.order_id ?? null,
              issue_type: "refund_without_receipt",
              discriminator: refund.id,
              details: { refund_id: refund.id },
            })
          }
        }
      }
    }

    const activeFingerprints = new Set<string>()
    for (const finding of findings) {
      const fingerprint = hashVietQrCommand({
        payment_session_id: finding.payment_session_id,
        issue_type: finding.issue_type,
        discriminator: finding.discriminator,
      })
      activeFingerprints.add(fingerprint)
      const existing = await vietQrService.listVietQrReconciliationIssues({
        fingerprint,
      })
      if (!existing.length) {
        await vietQrService.createVietQrReconciliationIssues({
          payment_session_id: finding.payment_session_id,
          order_id: finding.order_id,
          fingerprint,
          issue_type: finding.issue_type,
          status: "open",
          details: finding.details,
          detected_at: new Date(),
        })
      } else if (existing[0].status === "resolved") {
        await vietQrService.updateVietQrReconciliationIssues({
          id: existing[0].id,
          status: "open",
          details: finding.details,
          detected_at: new Date(),
          resolved_at: null,
        })
      }
    }

    const openIssues = await vietQrService.listVietQrReconciliationIssues({
      status: "open",
    })
    const resolved = openIssues.filter(
      (issue) => !activeFingerprints.has(issue.fingerprint)
    )
    if (resolved.length) {
      await vietQrService.updateVietQrReconciliationIssues(
        resolved.map((issue) => ({
          id: issue.id,
          status: "resolved" as const,
          resolved_at: new Date(),
        }))
      )
    }

    await securityService.createAuditEvents(
      prepareAuditEvent({
        correlation_id: `vietqr-reconcile:${Date.now()}`,
        actor_id: "system",
        actor_type: "system",
        action: "vietqr.reconciliation.completed",
        resource_type: "vietqr_reconciliation_issue",
        outcome: "success",
        metadata: {
          sessions_scanned: sessions.length,
          findings: findings.length,
          resolved: resolved.length,
          automated_financial_transitions: 0,
        },
      })
    )

    return new StepResponse({
      sessions_scanned: sessions.length,
      findings: findings.length,
      resolved: resolved.length,
    })
  }
)

export const reconcileVietQrPaymentsWorkflow = createWorkflow(
  "reconcile-viet-qr-payments",
  () => {
    const result = reconcileVietQrPaymentsStep()
    return new WorkflowResponse(result)
  }
)
