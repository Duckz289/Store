import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useParams, useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)
  const router = useRouter()
  const { countryCode } = useParams() as { countryCode: string }

  useEffect(() => {
    if (message?.state === "success") {
      router.replace(`/${countryCode}/account`)
      router.refresh()
    }
  }, [countryCode, message?.state, router])

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="type-section-title mb-3 text-center">Đăng nhập</h1>
      <p className="type-body mb-7 text-center text-[var(--hp-muted)]">
        Theo dõi đơn hàng và lưu địa chỉ nhanh hơn. Bạn vẫn có thể mua hàng với tư cách khách.
      </p>
      {message?.state === "verification_required" && (
        <div
          className="w-full mb-6 text-center text-base-regular text-ui-fg-base bg-ui-bg-subtle border border-ui-border-base rounded-rounded p-4"
          data-testid="login-verification-message"
        >
          Chúng tôi đã gửi liên kết xác minh tới <strong>{message.email}</strong>.
          Vui lòng xác minh email rồi đăng nhập lại.
        </div>
      )}
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />
        <div className="mt-3 flex justify-end">
          <LocalizedClientLink
            href="/account/forgot-password"
            className="type-header-label text-[var(--hp-accent)] hover:underline"
          >
            Quên mật khẩu?
          </LocalizedClientLink>
        </div>
        <SubmitButton data-testid="sign-in-button" className="w-full mt-5">
          Đăng nhập
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Chưa có tài khoản?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Đăng ký
        </button>
        .
      </span>
    </div>
  )
}

export default Login
