import type { IPaymentModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  authorizePaymentSessionForOrderWorkflow,
  capturePaymentWorkflow,
} from "@medusajs/medusa/core-flows"

import { SECURITY_MODULE } from "../../modules/security"
import SecurityModuleService from "../../modules/security/service"
import { VIETQR_MODULE } from "../../modules/vietqr"
import VietQrModuleService from "../../modules/vietqr/service"
import { prepareAuditEvent } from "../../utils/security-audit"
import {
  asVietQrPaymentData,
  classifyVietQrObservation,
  createVietQrConfirmationProof,
  hashBankTransactionReference,
  hashVietQrCommand,
  hasValidIntent,
  maskBankReference,
  normalizeVndAmount,
  VIETQR_PROVIDER_ID,
} from "../../utils/vietqr-payment"

export type ConfirmVietQrPaymentInput = {
  order_id: string
  actor_id: string
  idempotency_key: string
  observed_amount: string
  currency_code: "vnd"
  observed_reference: string
  bank_transaction_reference: string
  observed_at: string
  note?: string | null
}

const confirmVietQrPaymentStep = createStep(
  "confirm-viet-qr-payment",
  async (input: ConfirmVietQrPaymentInput, { container }) => {
    const paymentService = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )
    const vietQrService = container.resolve<VietQrModuleService>(VIETQR_MODULE)
    const securityService = container.resolve<SecurityModuleService>(
      SECURITY_MODULE
    )
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const locking = container.resolve(Modules.LOCKING)
    const observedAmount = normalizeVndAmount(input.observed_amount)
    const transactionReference = input.bank_transaction_reference.trim()
    const transactionHash = hashBankTransactionReference(transactionReference)
    const requestHash = hashVietQrCommand({
      order_id: input.order_id,
      observed_amount: observedAmount,
      currency_code: input.currency_code,
      observed_reference: input.observed_reference.trim(),
      bank_transaction_hash: transactionHash,
      observed_at: input.observed_at,
      note: input.note?.trim() || null,
    })

    const result = await locking.execute(
      [
        `vietqr-order:${input.order_id}`,
        `vietqr-transaction:${transactionHash}`,
        `vietqr-command:${input.idempotency_key}`,
      ],
      async () => {
        const receipts = await vietQrService.listVietQrCommandReceipts({
          operation: "confirm",
          idempotency_key: input.idempotency_key,
        })
        if (receipts.length) {
          if (receipts[0].request_hash !== requestHash) {
            throw new MedusaError(
              MedusaError.Types.CONFLICT,
              "VIETQR_IDEMPOTENCY_KEY_REUSED"
            )
          }

          const observation =
            await vietQrService.retrieveVietQrTransferObservation(
              receipts[0].result_id
            )
          return {
            observation,
            payment: null,
            replayed: true,
          }
        }

        const { data: orderPaymentCollections } = await query.graph({
          entity: "order_payment_collection",
          fields: ["order.id", "payment_collection.id"],
          filters: { order_id: input.order_id },
        })
        const paymentCollectionId =
          orderPaymentCollections[0]?.payment_collection?.id
        if (!paymentCollectionId) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "VIETQR_ORDER_PAYMENT_COLLECTION_NOT_FOUND"
          )
        }

        const collection = await paymentService.retrievePaymentCollection(
          paymentCollectionId,
          { relations: ["payment_sessions", "payments", "payments.captures"] }
        )
        const session = collection.payment_sessions?.find(
          (candidate) => candidate.provider_id === VIETQR_PROVIDER_ID
        )
        if (!session) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "VIETQR_PAYMENT_SESSION_NOT_FOUND"
          )
        }

        const data = asVietQrPaymentData(session.data)
        const secret = process.env.VIETQR_CONFIRMATION_SECRET ?? ""
        if (!secret || !hasValidIntent(secret, data)) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "VIETQR_PAYMENT_INTENT_INTEGRITY_FAILED"
          )
        }
        if (
          normalizeVndAmount(session.amount) !== data.expected_amount ||
          session.currency_code.toLowerCase() !== data.currency_code
        ) {
          throw new MedusaError(
            MedusaError.Types.NOT_ALLOWED,
            "VIETQR_PAYMENT_SESSION_AMOUNT_MISMATCH"
          )
        }

        const classifiedOutcome = classifyVietQrObservation({
          expected_amount: data.expected_amount,
          observed_amount: observedAmount,
          expected_reference: data.reference,
          observed_reference: input.observed_reference,
          expires_at: data.expires_at,
          observed_at: input.observed_at,
        })
        const priorObservations =
          await vietQrService.listVietQrTransferObservations({
            bank_transaction_hash: transactionHash,
          })
        if (
          priorObservations.length &&
          priorObservations[0].payment_session_id !== session.id
        ) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "VIETQR_BANK_TRANSACTION_ALREADY_USED"
          )
        }

        const priorObservation = priorObservations[0]
        if (
          priorObservation &&
          (normalizeVndAmount(priorObservation.observed_amount) !==
            observedAmount ||
            priorObservation.currency_code.toLowerCase() !==
              input.currency_code ||
            priorObservation.observed_reference.trim() !==
              input.observed_reference.trim() ||
            new Date(priorObservation.observed_at).getTime() !==
              new Date(input.observed_at).getTime() ||
            priorObservation.outcome !== classifiedOutcome)
        ) {
          throw new MedusaError(
            MedusaError.Types.CONFLICT,
            "VIETQR_BANK_TRANSACTION_OBSERVATION_MISMATCH"
          )
        }

        const outcome = priorObservation?.outcome ?? classifiedOutcome

        const observation =
          priorObservation ??
          (await vietQrService.createVietQrTransferObservations({
            payment_session_id: session.id,
            order_id: input.order_id,
            provider_reference: data.reference,
            expected_amount: Number(data.expected_amount),
            observed_amount: Number(observedAmount),
            currency_code: input.currency_code,
            observed_reference: input.observed_reference.trim(),
            outcome,
            bank_transaction_reference: transactionReference,
            bank_transaction_hash: transactionHash,
            note: input.note?.trim() || null,
            actor_id: input.actor_id,
            observed_at: new Date(input.observed_at),
          }))

        let payment = collection.payments?.find(
          (candidate) =>
            asVietQrPaymentData(candidate.data).session_id === session.id
        )
        if (outcome === "exact") {
          if (
            session.status === PaymentSessionStatus.PENDING_AUTHORIZATION ||
            session.status === PaymentSessionStatus.PENDING
          ) {
            const confirmationProof = createVietQrConfirmationProof(secret, {
              ...data,
              bank_transaction_hash: transactionHash,
            })
            await paymentService.updatePaymentSession({
              id: session.id,
              amount: session.amount,
              currency_code: session.currency_code,
              data: {
                ...data,
                confirmation_proof: confirmationProof,
                bank_transaction_hash: transactionHash,
                confirmed_at: new Date().toISOString(),
              },
            })
          }

          if (!payment) {
            const authorization =
              await authorizePaymentSessionForOrderWorkflow(container).run({
                input: { payment_session_id: session.id },
              })
            payment = authorization.result ?? undefined
          }
          if (!payment) {
            throw new MedusaError(
              MedusaError.Types.UNEXPECTED_STATE,
              "VIETQR_AUTHORIZATION_DID_NOT_CREATE_PAYMENT"
            )
          }

          const existingCaptures = payment.captures ?? []
          if (!existingCaptures.length && !payment.captured_at) {
            const captured = await capturePaymentWorkflow(container).run({
              input: {
                payment_id: payment.id,
                captured_by: input.actor_id,
              },
            })
            payment = captured.result
          }
        } else {
          const issueFingerprint = hashVietQrCommand({
            payment_session_id: session.id,
            issue_type: `observation_${outcome}`,
            transaction_hash: transactionHash,
          })
          const existingIssues =
            await vietQrService.listVietQrReconciliationIssues({
              fingerprint: issueFingerprint,
            })
          if (!existingIssues.length) {
            await vietQrService.createVietQrReconciliationIssues({
              payment_session_id: session.id,
              order_id: input.order_id,
              fingerprint: issueFingerprint,
              issue_type:
                outcome === "expired"
                  ? "expired_pending"
                  : "amount_currency_mismatch",
              status: "open",
              details: {
                outcome,
                expected_amount: data.expected_amount,
                observed_amount: observedAmount,
              },
              detected_at: new Date(),
            })
          }
        }

        await vietQrService.createVietQrCommandReceipts({
          operation: "confirm",
          idempotency_key: input.idempotency_key,
          request_hash: requestHash,
          result_type: "vietqr_transfer_observation",
          result_id: observation.id,
          actor_id: input.actor_id,
          completed_at: new Date(),
        })
        await securityService.createAuditEvents(
          prepareAuditEvent({
            correlation_id: `vietqr:${session.id}`,
            actor_id: input.actor_id,
            actor_type: "user",
            action:
              outcome === "exact"
                ? "vietqr.payment.confirmed"
                : "vietqr.payment.review_required",
            resource_type: "payment_session",
            resource_id: session.id,
            outcome: "success",
            metadata: {
              order_id: input.order_id,
              reference: data.reference,
              observation_outcome: outcome,
              bank_transaction: maskBankReference(transactionReference),
              captured: Boolean(payment?.captured_at || payment?.captures?.length),
            },
          })
        )

        return { observation, payment: payment ?? null, replayed: false }
      }
    )

    return new StepResponse(result)
  }
)

export const confirmVietQrPaymentWorkflow = createWorkflow(
  "confirm-viet-qr-payment",
  (input: ConfirmVietQrPaymentInput) => {
    const result = confirmVietQrPaymentStep(input)
    return new WorkflowResponse(result)
  }
)
