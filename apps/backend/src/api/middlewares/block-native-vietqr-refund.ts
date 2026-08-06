import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { IPaymentModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"

import { VIETQR_PROVIDER_ID } from "../../utils/vietqr-payment"

export async function blockNativeVietQrRefund(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const paymentService = req.scope.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )
    const payment = await paymentService.retrievePayment(req.params.id)

    if (payment.provider_id === VIETQR_PROVIDER_ID) {
      return next(
        new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "VIETQR_REFUND_REQUIRES_MANUAL_BANK_TRANSACTION"
        )
      )
    }

    return next()
  } catch (error) {
    return next(error)
  }
}
