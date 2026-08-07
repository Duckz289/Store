import type { Metadata } from "next"

import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  description: "Đặt lại mật khẩu tài khoản khách hàng.",
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { email = "", token = "" } = await searchParams

  return <ResetPassword email={email} token={token} />
}
