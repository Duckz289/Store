import { MedusaService } from "@medusajs/framework/utils"

import AuditEvent from "./models/audit-event"
import MfaAssurance from "./models/mfa-assurance"

class SecurityModuleService extends MedusaService({
  AuditEvent,
  MfaAssurance,
}) {}

export default SecurityModuleService
