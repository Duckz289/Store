import { PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils"

import {
  createVietQrConfirmationProof,
  createVietQrIntentHash,
  createVietQrReference,
  hashBankTransactionReference,
  VietQrPaymentData,
  VietQrProviderOptions,
} from "../../../utils/vietqr-payment"
import VietQrPaymentProviderService from "../service"

const options: VietQrProviderOptions = {
  bank_bin: "970436",
  account_number: "1234567890",
  account_name: "DTC TEST MERCHANT",
  confirmation_secret: "unit-test-secret-with-more-than-32-characters",
  expiry_minutes: 30,
  qr_template: "compact2",
}

const initiate = async () => {
  const provider = new VietQrPaymentProviderService({}, options)
  const result = await provider.initiatePayment({
    amount: 1_250_000,
    currency_code: "vnd",
    data: {
      session_id: "payses_unit_vietqr",
      expected_amount: "1",
      reference: "CLIENT-CANNOT-SET",
    },
  })

  return { provider, result, data: result.data as VietQrPaymentData }
}

describe("VietQrPaymentProviderService", () => {
  it("creates a backend-owned immutable reference, amount, expiry, and QR URL", async () => {
    const { result, data } = await initiate()

    expect(result.status).toBe(PaymentSessionStatus.PENDING)
    expect(data.reference).toBe(
      createVietQrReference(options.confirmation_secret, data.session_id)
    )
    expect(data.reference).not.toBe("CLIENT-CANNOT-SET")
    expect(data.expected_amount).toBe("1250000")
    expect(data.currency_code).toBe("vnd")
    expect(data.transfer_content).toContain(data.reference)
    expect(data.qr_image_url).toContain("amount=1250000")
    expect(decodeURIComponent(data.qr_image_url)).toContain(data.reference)
    expect(new Date(data.expires_at).getTime()).toBeGreaterThan(
      new Date(data.created_at).getTime()
    )
  })

  it("keeps asynchronous authorization pending without a signed observation", async () => {
    const { provider, data } = await initiate()
    const result = await provider.authorizePayment({ data })

    expect(result.status).toBe(PaymentSessionStatus.PENDING_AUTHORIZATION)
  })

  it("authorizes and captures once a valid backend proof is present", async () => {
    const { provider, data } = await initiate()
    const bankTransactionHash = hashBankTransactionReference("BANK-TX-001")
    const confirmationProof = createVietQrConfirmationProof(
      options.confirmation_secret,
      { ...data, bank_transaction_hash: bankTransactionHash }
    )
    const updated = await provider.updatePayment({
      amount: data.expected_amount,
      currency_code: data.currency_code,
      data: {
        ...data,
        bank_transaction_hash: bankTransactionHash,
        confirmation_proof: confirmationProof,
      },
    })
    const authorized = await provider.authorizePayment({ data: updated.data })
    const captured = await provider.capturePayment({ data: authorized.data })

    expect(updated.status).toBe(PaymentSessionStatus.PENDING_AUTHORIZATION)
    expect(authorized.status).toBe(PaymentSessionStatus.AUTHORIZED)
    expect(captured.data?.captured_at).toBeTruthy()
  })

  it("does not authorize an expired QR even with a valid proof", async () => {
    const { provider, data } = await initiate()
    const expired = {
      ...data,
      expires_at: new Date(Date.now() - 60_000).toISOString(),
      intent_hash: "",
    }
    expired.intent_hash = createVietQrIntentHash(
      options.confirmation_secret,
      expired
    )
    const bankTransactionHash = hashBankTransactionReference("BANK-TX-EXPIRED")
    const proof = createVietQrConfirmationProof(options.confirmation_secret, {
      ...expired,
      bank_transaction_hash: bankTransactionHash,
    })
    const result = await provider.authorizePayment({
      data: {
        ...expired,
        bank_transaction_hash: bankTransactionHash,
        confirmation_proof: proof,
      },
    })

    expect(result.status).toBe(PaymentSessionStatus.PENDING_AUTHORIZATION)
  })

  it("keeps refund separate and rejects it before capture", async () => {
    const { provider, data } = await initiate()

    await expect(
      provider.refundPayment({ amount: 100_000, data })
    ).rejects.toThrow("captured, manually confirmed")
  })

  it("rejects tampered intent data and unsupported currencies", async () => {
    const { provider, data } = await initiate()

    await expect(
      provider.authorizePayment({
        data: { ...data, expected_amount: "1" },
      })
    ).rejects.toThrow("integrity")
    await expect(
      provider.initiatePayment({
        amount: 100,
        currency_code: "usd",
        data: { session_id: "payses_unit_usd" },
      })
    ).rejects.toThrow("only supports VND")
  })

  it("never treats a webhook payload as payment confirmation", async () => {
    const { provider } = await initiate()
    const result = await provider.getWebhookActionAndData({
      data: { event: "paid" },
      rawData: JSON.stringify({ event: "paid" }),
      headers: {},
    })

    expect(result.action).toBe(PaymentActions.NOT_SUPPORTED)
  })
})
