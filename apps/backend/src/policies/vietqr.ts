import { definePolicies, PolicyOperation } from "@medusajs/framework/utils"

export const vietQrPolicies = definePolicies([
  {
    name: "ReadVietQrPayment",
    description: "Read redacted VietQR payment and reconciliation details",
    resource: "vietqr_payment",
    operation: PolicyOperation.read,
  },
  {
    name: "ConfirmVietQrPayment",
    description: "Confirm an exact VietQR bank transfer",
    resource: "vietqr_payment",
    operation: "confirm",
  },
  {
    name: "RefundVietQrPayment",
    description: "Record a completed manual VietQR refund",
    resource: "vietqr_payment",
    operation: "refund",
  },
  {
    name: "ReconcileVietQrPayment",
    description: "Reconcile VietQR payment consistency issues",
    resource: "vietqr_reconciliation_issue",
    operation: "reconcile",
  },
  {
    name: "ReadVietQrReconciliationIssue",
    description: "Read redacted VietQR reconciliation issues",
    resource: "vietqr_reconciliation_issue",
    operation: PolicyOperation.read,
  },
])
