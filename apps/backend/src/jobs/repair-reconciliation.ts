import type { MedusaContainer } from "@medusajs/framework/types"

import { reconcileRepairCasesWorkflow } from "../workflows/repair/reconcile-repair-cases"

export default async function repairReconciliationJob(
  container: MedusaContainer
) {
  await reconcileRepairCasesWorkflow(container).run()
}

export const config = {
  name: "repair-reconciliation",
  schedule: "17 * * * *",
}
