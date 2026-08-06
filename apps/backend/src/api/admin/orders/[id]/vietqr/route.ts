import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { IPaymentModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

import { VIETQR_MODULE } from "../../../../../modules/vietqr"
import VietQrModuleService from "../../../../../modules/vietqr/service"
import {
  asVietQrPaymentData,
  maskAccountNumber,
  maskBankReference,
  VIETQR_PROVIDER_ID,
} from "../../../../../utils/vietqr-payment"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const paymentService = req.scope.resolve<IPaymentModuleService>(
    Modules.PAYMENT
  )
  const vietQrService = req.scope.resolve<VietQrModuleService>(VIETQR_MODULE)
  const { data: links } = await query.graph({
    entity: "order_payment_collection",
    fields: ["order.id", "payment_collection.id"],
    filters: { order_id: req.params.id },
  })
  const paymentCollectionId = links[0]?.payment_collection?.id
  if (!paymentCollectionId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "ORDER_PAYMENT_COLLECTION_NOT_FOUND"
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
    return res.status(200).json({ vietqr: null })
  }

  const data = asVietQrPaymentData(session.data)
  const [observations, issues] = await Promise.all([
    vietQrService.listVietQrTransferObservations(
      { payment_session_id: session.id },
      { order: { observed_at: "DESC" } }
    ),
    vietQrService.listVietQrReconciliationIssues(
      { payment_session_id: session.id },
      { order: { detected_at: "DESC" } }
    ),
  ])
  const payment = collection.payments?.find(
    (candidate) => asVietQrPaymentData(candidate.data).session_id === session.id
  )

  return res.status(200).json({
    vietqr: {
      payment_session_id: session.id,
      payment_session_status: session.status,
      payment_id: payment?.id ?? null,
      captured_at: payment?.captured_at ?? null,
      reference: data.reference,
      expected_amount: data.expected_amount,
      currency_code: data.currency_code,
      bank_bin: data.bank_bin,
      account_number: maskAccountNumber(data.account_number),
      account_name: data.account_name,
      transfer_content: data.transfer_content,
      qr_image_url: data.qr_image_url,
      expires_at: data.expires_at,
      observations: observations.map((observation) => ({
        id: observation.id,
        outcome: observation.outcome,
        observed_amount: observation.observed_amount,
        observed_at: observation.observed_at,
        bank_transaction_reference: maskBankReference(
          observation.bank_transaction_reference
        ),
      })),
      issues: issues.map((issue) => ({
        id: issue.id,
        issue_type: issue.issue_type,
        status: issue.status,
        detected_at: issue.detected_at,
      })),
    },
  })
}
