"use client"

import { resetPassword } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useActionState } from "react"

type ResetPasswordProps = {
  email: string
  token: string
}

const ResetPassword = ({ email, token }: ResetPasswordProps) => {
  const [state, formAction] = useActionState(resetPassword, null)

  if (!email || !token) {
    return (
      <section className="mx-auto w-full max-w-md rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-6 shadow-[var(--hp-shadow-card)] sm:p-8">
        <h1 className="type-section-title">Liên kết không hợp lệ</h1>
        <p className="type-body mt-3 text-[var(--hp-muted)]">
          Liên kết khôi phục thiếu thông tin hoặc đã bị thay đổi. Hãy yêu cầu một liên kết mới.
        </p>
        <LocalizedClientLink
          href="/account/forgot-password"
          className="type-header-label mt-6 inline-flex text-[var(--hp-accent)] hover:underline"
        >
          Yêu cầu liên kết mới
        </LocalizedClientLink>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-6 shadow-[var(--hp-shadow-card)] sm:p-8">
      <h1 className="type-section-title">Đặt lại mật khẩu</h1>
      <p className="type-body mt-3 text-[var(--hp-muted)]">
        Chọn mật khẩu mới có ít nhất 12 ký tự, gồm chữ cái và chữ số.
      </p>

      {state?.state === "success" ? (
        <div className="mt-6" aria-live="polite">
          <p className="type-body text-[var(--hp-success)]" data-testid="reset-password-success">
            Mật khẩu đã được đặt lại. Hãy đăng nhập bằng mật khẩu mới.
          </p>
          <LocalizedClientLink
            href="/account"
            className="type-header-label mt-4 inline-flex text-[var(--hp-accent)] hover:underline"
          >
            Đăng nhập
          </LocalizedClientLink>
        </div>
      ) : (
        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="token" value={token} />
          <Input
            label="Mật khẩu mới"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="reset-password-input"
          />
          <Input
            label="Xác nhận mật khẩu mới"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            data-testid="reset-password-confirmation-input"
          />
          <div aria-live="polite">
            {state?.state === "error" && (
              <p className="type-product-spec text-[var(--hp-danger)]" role="alert">
                {state.error}
              </p>
            )}
          </div>
          <SubmitButton className="w-full" data-testid="reset-password-submit">
            Cập nhật mật khẩu
          </SubmitButton>
        </form>
      )}
    </section>
  )
}

export default ResetPassword
