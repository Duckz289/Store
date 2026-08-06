import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"

import { ConfirmVietQrPaymentSchema } from "../../../../../vietqr-validators"
import { confirmVietQrPaymentWorkflow } from "../../../../../../workflows/vietqr/confirm-vietqr-payment"

type ConfirmBody = z.infer<typeof ConfirmVietQrPaymentSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<ConfirmBody>,
  res: MedusaResponse
) => {
  const { result } = await confirmVietQrPaymentWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      actor_id: req.auth_context.actor_id,
      ...req.validatedBody,
      note: req.validatedBody.note ?? null,
    },
  })

  return res.status(200).json(result)
}
