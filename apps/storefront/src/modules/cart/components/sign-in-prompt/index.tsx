import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--hp-radius-control)] border border-[var(--hp-line)] bg-[var(--hp-paper)] p-4 sm:p-5">
      <div className="min-w-0">
        <Heading level="h2" className="type-product-title text-base sm:text-lg">
          Bạn đã có tài khoản?
        </Heading>
        <Text className="type-product-spec mt-1 text-[var(--hp-muted)]">
          Đăng nhập để dùng địa chỉ đã lưu và theo dõi đơn hàng.
        </Text>
      </div>
      <div className="shrink-0">
        <LocalizedClientLink href="/account">
          <Button variant="secondary" className="h-10 border-[var(--hp-accent)] px-4 text-[var(--hp-accent)] hover:bg-[var(--hp-accent-soft)]" data-testid="sign-in-button">
            Đăng nhập
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
