import { z } from "@medusajs/framework/zod"

const amount = z.string().regex(/^[1-9]\d{0,12}$/)
const idempotencyKey = z.string().min(16).max(128)
const bankTransactionReference = z.string().trim().min(4).max(128)

export const ConfirmVietQrPaymentSchema = z.object({
  idempotency_key: idempotencyKey,
  observed_amount: amount,
  currency_code: z.literal("vnd"),
  observed_reference: z.string().trim().min(1).max(100),
  bank_transaction_reference: bankTransactionReference,
  observed_at: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(500).nullish(),
})
export const RefundVietQrPaymentSchema = z.object({
  order_id: z.string().trim().min(1).max(128).nullish(),
  idempotency_key: idempotencyKey,
  amount,
  bank_transaction_reference: bankTransactionReference,
  refunded_at: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(500).nullish(),
})
