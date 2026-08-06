export type VietQrAdminStatus = {
  payment_session_id: string
  payment_session_status: string
  payment_id: string | null
  captured_at: string | null
  reference: string
  expected_amount: string
  currency_code: "vnd"
  bank_bin: string
  account_number: string
  account_name: string
  transfer_content: string
  qr_image_url: string
  expires_at: string
  observations: {
    id: string
    outcome: string
    observed_amount: number
    observed_at: string
    bank_transaction_reference: string
  }[]
  issues: {
    id: string
    issue_type: string
    status: string
    detected_at: string
  }[]
}
export type VietQrAdminResponse = {
  vietqr: VietQrAdminStatus | null
}
