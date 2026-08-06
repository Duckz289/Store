import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { RefundVietQrPaymentSchema } from "../../../../../vietqr-validators"
import { refundVietQrPaymentWorkflow } from "../../../../../../workflows/vietqr/refund-vietqr-payment"

type RefundBody = z.infer<typeof RefundVietQrPaymentSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<RefundBody>,
  res: MedusaResponse
) => {
  const { result } = await refundVietQrPaymentWorkflow(req.scope).run({
    input: {
      payment_id: req.params.id,
      actor_id: req.auth_context.actor_id,
      ...req.validatedBody,
      order_id: req.validatedBody.order_id ?? null,
      note: req.validatedBody.note ?? null,
    },
  })

  return res.status(200).json(result)
}
