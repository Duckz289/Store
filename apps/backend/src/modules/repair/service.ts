import { MedusaService } from "@medusajs/framework/utils"

import RepairAccessToken from "./models/repair-access-token"
import RepairAttachment from "./models/repair-attachment"
import RepairCase from "./models/repair-case"
import RepairCommandReceipt from "./models/repair-command-receipt"
import RepairContactSnapshot from "./models/repair-contact-snapshot"
import RepairDeviceSnapshot from "./models/repair-device-snapshot"
import RepairDiagnosis from "./models/repair-diagnosis"
import RepairPartUsage from "./models/repair-part-usage"
import RepairQuoteDecision from "./models/repair-quote-decision"
import RepairQuoteItem from "./models/repair-quote-item"
import RepairQuote from "./models/repair-quote"
import RepairReconciliationIssue from "./models/repair-reconciliation-issue"
import RepairStatusHistory from "./models/repair-status-history"
import RepairTechnicianAssignment from "./models/repair-technician-assignment"

class RepairModuleService extends MedusaService({
  RepairCase,
  RepairContactSnapshot,
  RepairDeviceSnapshot,
  RepairDiagnosis,
  RepairQuote,
  RepairQuoteItem,
  RepairQuoteDecision,
  RepairAccessToken,
  RepairPartUsage,
  RepairTechnicianAssignment,
  RepairAttachment,
  RepairStatusHistory,
  RepairCommandReceipt,
  RepairReconciliationIssue,
}) {}

export default RepairModuleService
