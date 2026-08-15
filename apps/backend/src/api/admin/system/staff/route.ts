import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

import { listSystemStaffWorkflow } from "../../../../workflows/system/list-system-staff"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await listSystemStaffWorkflow(req.scope).run()

  return res.status(200).json(result)
}
