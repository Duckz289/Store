import { MedusaService } from "@medusajs/framework/utils"

import VietQrCommandReceipt from "./models/vietqr-command-receipt"
import VietQrManualRefund from "./models/vietqr-manual-refund"
import VietQrReconciliationIssue from "./models/vietqr-reconciliation-issue"
import VietQrTransferObservation from "./models/vietqr-transfer-observation"

class VietQrModuleService extends MedusaService({
  VietQrTransferObservation,
  VietQrCommandReceipt,
  VietQrManualRefund,
  VietQrReconciliationIssue,
}) {}

export default VietQrModuleService
