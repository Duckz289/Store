import type { Metadata } from "next"

import ForgotPassword from "@modules/account/components/forgot-password"

export const metadata: Metadata = {
  title: "Khôi phục mật khẩu",
  description: "Yêu cầu hướng dẫn đặt lại mật khẩu tài khoản.",
}

export default function ForgotPasswordPage() {
  return <ForgotPassword />
}
