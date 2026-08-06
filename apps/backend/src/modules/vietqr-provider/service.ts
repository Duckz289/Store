import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"

import {
  asVietQrPaymentData,
  buildVietQrImageUrl,
  createVietQrIntentHash,
  createVietQrReference,
  hasValidConfirmation,
  hasValidIntent,
  normalizeVndAmount,
  validateVietQrOptions,
  VIETQR_SCHEMA_VERSION,
  VietQrPaymentData,
  VietQrProviderOptions,
} from "../../utils/vietqr-payment"

class VietQrPaymentProviderService extends AbstractPaymentProvider<VietQrProviderOptions> {
  static identifier = "vietqr"

  protected readonly options_: VietQrProviderOptions

  constructor(container: Record<string, unknown>, options: VietQrProviderOptions) {
    const validated = validateVietQrOptions(options)
    super(container, validated)
    this.options_ = validated
  }

  static validateOptions(options: Record<string, unknown>) {
    validateVietQrOptions(options)
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const data = this.buildSessionData(input)

    return {
      id: data.session_id,
      status: PaymentSessionStatus.PENDING,
      data,
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const current = asVietQrPaymentData(input.data)
    const data = this.buildSessionData(input, current)
    const confirmationValid = hasValidConfirmation(
      this.options_.confirmation_secret,
      current
    )

    if (confirmationValid && current.intent_hash === data.intent_hash) {
      data.confirmation_proof = current.confirmation_proof
      data.bank_transaction_hash = current.bank_transaction_hash
      data.confirmed_at = current.confirmed_at
    }

    return {
      status: confirmationValid
        ? PaymentSessionStatus.PENDING_AUTHORIZATION
        : PaymentSessionStatus.PENDING,
      data,
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const data = asVietQrPaymentData(input.data)
    this.assertIntent(data)

    if (
      new Date(data.expires_at) < new Date() ||
      !hasValidConfirmation(this.options_.confirmation_secret, data)
    ) {
      return { data, status: PaymentSessionStatus.PENDING_AUTHORIZATION }
    }

    return {
      data: {
        ...data,
        confirmed_at: data.confirmed_at ?? new Date().toISOString(),
      },
      status: PaymentSessionStatus.AUTHORIZED,
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const data = asVietQrPaymentData(input.data)
    this.assertIntent(data)

    if (!hasValidConfirmation(this.options_.confirmation_secret, data)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "VietQR payment cannot be captured without a valid manual confirmation"
      )
    }

    return {
      data: {
        ...data,
        captured_at: data.captured_at ?? new Date().toISOString(),
      },
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const data = asVietQrPaymentData(input.data)
    this.assertIntent(data)

    if (data.captured_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Captured VietQR payments cannot be canceled"
      )
    }

    return {
      data: {
        ...data,
        canceled_at: data.canceled_at ?? new Date().toISOString(),
      },
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const data = asVietQrPaymentData(input.data)
    normalizeVndAmount(input.amount)
    this.assertIntent(data)

    if (
      !hasValidConfirmation(this.options_.confirmation_secret, data) ||
      !data.captured_at
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "VietQR refund requires a captured, manually confirmed payment"
      )
    }

    return {
      data: {
        ...data,
        refunded_at: new Date().toISOString(),
      },
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const data = asVietQrPaymentData(input.data)
    this.assertIntent(data)
    return { data: { ...data, canceled_at: new Date().toISOString() } }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const data = asVietQrPaymentData(input.data)
    this.assertIntent(data)
    return { data }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const data = asVietQrPaymentData(input.data)
    this.assertIntent(data)

    if (data.canceled_at) {
      return { data, status: PaymentSessionStatus.CANCELED }
    }
    if (data.captured_at) {
      return { data, status: PaymentSessionStatus.CAPTURED }
    }
    if (hasValidConfirmation(this.options_.confirmation_secret, data)) {
      return { data, status: PaymentSessionStatus.AUTHORIZED }
    }

    return { data, status: PaymentSessionStatus.PENDING_AUTHORIZATION }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    return { action: PaymentActions.NOT_SUPPORTED }
  }

  private buildSessionData(
    input: Pick<InitiatePaymentInput, "amount" | "currency_code" | "data">,
    current?: VietQrPaymentData
  ): VietQrPaymentData {
    const currencyCode = input.currency_code.toLowerCase()
    if (currencyCode !== "vnd") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "VietQR provider only supports VND"
      )
    }

    const sessionId = String(input.data?.session_id ?? current?.session_id ?? "")
    if (!sessionId.startsWith("payses_")) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Trusted Medusa payment session ID is required"
      )
    }

    const amount = normalizeVndAmount(input.amount)
    const reference =
      current?.reference ??
      createVietQrReference(this.options_.confirmation_secret, sessionId)
    const createdAt = current?.created_at ?? new Date().toISOString()
    const expiresAt =
      current?.expires_at ??
      new Date(
        new Date(createdAt).getTime() +
          (this.options_.expiry_minutes ?? 30) * 60_000
      ).toISOString()
    const transferContent = `DH ${reference}`
    const data: VietQrPaymentData = {
      schema_version: VIETQR_SCHEMA_VERSION,
      session_id: sessionId,
      reference,
      expected_amount: amount,
      currency_code: "vnd",
      bank_bin: this.options_.bank_bin,
      account_number: this.options_.account_number,
      account_name: this.options_.account_name,
      transfer_content: transferContent,
      qr_image_url: buildVietQrImageUrl(
        this.options_,
        amount,
        transferContent
      ),
      created_at: createdAt,
      expires_at: expiresAt,
      intent_hash: "",
    }
    data.intent_hash = createVietQrIntentHash(
      this.options_.confirmation_secret,
      data
    )

    return data
  }

  private assertIntent(data: VietQrPaymentData) {
    if (
      !data?.session_id ||
      !data.reference ||
      !data.intent_hash ||
      !hasValidIntent(this.options_.confirmation_secret, data)
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "VietQR payment session data failed integrity verification"
      )
    }
  }
}

export default VietQrPaymentProviderService
