import type { IPaymentModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { refundPaymentWorkflow } from "@medusajs/medusa/core-flows"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { VIETQR_MODULE } from "../../modules/vietqr"
import VietQrModuleService from "../../modules/vietqr/service"
import { prepareAuditEvent } from "../../utils/security-audit"
import {
  asVietQrPaymentData,
  hashBankTransactionReference,
  hashVietQrCommand,
  hasValidIntent,
  maskBankReference,
  normalizeVndAmount,
  VIETQR_PROVIDER_ID,
} from "../../utils/vietqr-payment"

export type RefundVietQrPaymentInput = {
  payment_id: string
  order_id?: string | null
  actor_id: string
  idempotency_key: string
  amount: string
  bank_transaction_reference: string
  refunded_at: string
  note?: string | null
}

const refundVietQrPaymentStep = createStep(
  "refund-viet-qr-payment",
  async (input: RefundVietQrPaymentInput, { container }) => {
    const paymentService = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )
    const vietQrService = container.resolve<VietQrModuleService>(VIETQR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const locking = container.resolve(Modules.LOCKING)
    const amount = normalizeVndAmount(input.amount)
    const transactionReference = input.bank_transaction_reference.trim()
    const transactionHash = hashBankTransactionReference(transactionReference)
    const requestHash = hashVietQrCommand({
      payment_id: input.payment_id,
      order_id: input.order_id ?? null,
      amount,
      bank_transaction_hash: transactionHash,
      refunded_at: input.refunded_at,
      note: input.note?.trim() || null,
    })

    const result = await locking.execute(
      [
        `vietqr-payment:${input.payment_id}`,
        `vietqr-transaction:${transactionHash}`,
        `vietqr-command:${input.idempotency_key}`,
      ],
      async () => {
        const receipts = await vietQrService.listVietQrCommandReceipts({
          operation: "refund",
          idempotency_key: input.idempotency_key,
        })
        if (receipts.length) {
          if (receipts[0].request_hash !== requestHash) {
            throw new MedusaError(
              MedusaError.Types.CONFLICT,
              "VIETQR_IDEMPOTENCY_KEY_REUSED"
            )
          }
          return {
            manual_refund: await vietQrService.retrieveVietQrManualRefund(
              receipts[0].result_id
            ),
            replayed: true,
          }
        }

        let payment = await paymentService.retrievePayment(input.payment_id, {
          relations: ["payment_session", "captures", "refunds"],
        })
        if (payment.provider_id !== VIETQR_PROVIDER_ID) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "PAYMENT_IS_NOT_VIETQR"
          )
        }
        if (!payment.captured_at && !payment.captures?.length) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "VIETQR_PAYMENT_MUST_BE_CAPTURED_BEFORE_REFUND"
          )
        }

        const data = asVietQrPaymentData(payment.data)
        const secret = process.env.VIETQR_CONFIRMATION_SECRET ?? ""
        if (!secret || !hasValidIntent(secret, data)) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "VIETQR_PAYMENT_INTENT_INTEGRITY_FAILED"
          )
        }

        const priorRefunds = await vietQrService.listVietQrManualRefunds({
          bank_transaction_hash: transactionHash,
        })
        if (
          priorRefunds.length &&
          priorRefunds[0].payment_id !== input.payment_id
        ) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "VIETQR_BANK_TRANSACTION_ALREADY_USED"
          )
        }

        const priorRefund = priorRefunds[0]
        if (
          priorRefund &&
          (normalizeVndAmount(priorRefund.amount) !== amount ||
            new Date(priorRefund.refunded_at).getTime() !==
              new Date(input.refunded_at).getTime())
        ) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "VIETQR_BANK_TRANSACTION_REFUND_MISMATCH"
          )
        }

        const manualRefund =
          priorRefund ??
          (await vietQrService.createVietQrManualRefunds({
            payment_id: payment.id,
            order_id: input.order_id ?? null,
            amount: Number(amount),
            currency_code: payment.currency_code,
            bank_transaction_reference: transactionReference,
            bank_transaction_hash: transactionHash,
            note: input.note?.trim() || null,
            actor_id: input.actor_id,
            refunded_at: new Date(input.refunded_at),
          }))

        const refundMarker = `[vietqr:${manualRefund.id}]`
        const existingCoreRefund = payment.refunds?.find((refund) =>
          refund.note?.includes(refundMarker)
        )
        let coreRefund = existingCoreRefund
        if (!coreRefund) {
          const refunded = await refundPaymentWorkflow(container).run({
            input: {
              payment_id: payment.id,
              amount,
              created_by: input.actor_id,
              note: `${refundMarker} ${input.note?.trim() || "Manual bank refund"}`,
            },
          })
          coreRefund = refunded.result
        }
        if (!manualRefund.medusa_refund_id && coreRefund?.id) {
          await vietQrService.updateVietQrManualRefunds({
            id: manualRefund.id,
            medusa_refund_id: coreRefund.id,
          })
        }

        await vietQrService.createVietQrCommandReceipts({
          operation: "refund",
          idempotency_key: input.idempotency_key,
          request_hash: requestHash,
          result_type: "vietqr_manual_refund",
          result_id: manualRefund.id,
          actor_id: input.actor_id,
          completed_at: new Date(),
        })
        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `vietqr:${data.session_id}`,
            actor_id: input.actor_id,
            actor_type: "user",
            action: "vietqr.payment.refunded",
            resource_type: "payment",
            resource_id: payment.id,
            outcome: "success",
            metadata: {
              order_id: input.order_id ?? null,
              amount,
              currency_code: payment.currency_code,
              bank_transaction: maskBankReference(transactionReference),
            },
          })
        )

        return { manual_refund: manualRefund, replayed: false }
      }
    )

    return new StepResponse(result)
  }
)

export const refundVietQrPaymentWorkflow = createWorkflow(
  "refund-viet-qr-payment",
  (input: RefundVietQrPaymentInput) => {
    const result = refundVietQrPaymentStep(input)
    return new WorkflowResponse(result)
  }
)
