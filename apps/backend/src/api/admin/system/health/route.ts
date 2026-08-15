import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { getSystemHealthWorkflow } from "../../../../workflows/system/get-system-health"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await getSystemHealthWorkflow(req.scope).run()

  return res.status(200).json(result)
}
