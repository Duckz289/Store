import type { MedusaContainer } from "@medusajs/framework/types"

import { reconcileVietQrPaymentsWorkflow } from "../workflows/vietqr/reconcile-vietqr-payments"

export default async function vietQrReconciliationJob(
  container: MedusaContainer
) {
  await reconcileVietQrPaymentsWorkflow(container).run()
}
export const config = {
  name: "vietqr-reconciliation",
  schedule: "23 * * * *",
}
