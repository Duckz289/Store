type MedusaError = {
  response?: {
    data: { message?: string } | string
    status: number
    headers: unknown
  }
  request?: unknown
  message?: string
  config?: { url: string; baseURL: string }
}

export default function medusaError(error: unknown): never {
  const err = error as MedusaError
  if (err.response) {
    const data = err.response.data
    const backendMessage =
      typeof data === "object" && data !== null
        ? data.message
        : typeof data === "string"
          ? data
          : undefined
    const status = err.response.status
    const message =
      status === 401
        ? "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."
        : status === 409
          ? "Giỏ hàng đã thay đổi. Vui lòng kiểm tra lại giá, tồn kho và vận chuyển."
          : status === 400 || status === 404
            ? backendMessage || "Thông tin giỏ hàng không còn hợp lệ. Vui lòng kiểm tra lại."
            : backendMessage || "Không thể hoàn tất thao tác. Vui lòng thử lại."

    throw new Error(message)
  } else if (err.request) {
    throw new Error("Không nhận được phản hồi từ máy chủ. Vui lòng thử lại.")
  } else {
    throw new Error("Không thể kết nối tới máy chủ. Vui lòng thử lại.")
  }
}
