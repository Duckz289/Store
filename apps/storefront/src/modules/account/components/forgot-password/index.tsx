"use client"

import { requestPasswordReset } from "@lib/data/customer"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useActionState } from "react"

const ForgotPassword = () => {
  const [state, formAction] = useActionState(requestPasswordReset, null)

  return (
    <section className="mx-auto w-full max-w-md rounded-[var(--hp-radius-card)] border border-[var(--hp-line)] bg-[var(--hp-surface)] p-6 shadow-[var(--hp-shadow-card)] sm:p-8">
      <h1 className="type-section-title">Khôi phục mật khẩu</h1>
      <p className="type-body mt-3 text-[var(--hp-muted)]">
        Nhập email tài khoản. Nếu thông tin khớp và email khôi phục đã được cấu hình, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          data-testid="forgot-password-email-input"
        />
        <div aria-live="polite">
          {state?.state === "error" && (
            <p className="type-product-spec text-[var(--hp-danger)]" role="alert">
              {state.error}
            </p>
          )}
          {state?.state === "success" && (
            <p className="type-product-spec text-[var(--hp-success)]" data-testid="forgot-password-success">
              Nếu email khớp với một tài khoản, hướng dẫn khôi phục sẽ được gửi tới hộp thư đó.
            </p>
          )}
        </div>
        <SubmitButton className="w-full" data-testid="forgot-password-submit">
          Gửi hướng dẫn
        </SubmitButton>
      </form>

      <LocalizedClientLink
        href="/account"
        className="type-header-label mt-6 inline-flex text-[var(--hp-accent)] hover:underline"
      >
        Quay lại đăng nhập
      </LocalizedClientLink>
    </section>
  )
}

export default ForgotPassword
