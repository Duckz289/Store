# ADR-004: VietQR dùng Payment Provider với xác nhận thủ công

- Trạng thái: Accepted for implementation in internal development
- Ngày: 06/08/2026
- Người quyết định: Chủ dự án

## Bối cảnh

Milestone 3 cần VietQR nhưng repository không có credential, merchant contract, webhook secret hoặc API contract ngân hàng/VietQR provider. Việc dựng webhook giả hoặc suy diễn thanh toán từ ảnh biên lai/return URL sẽ tạo một nguồn sự thật tài chính không có căn cứ.

Medusa 2.18.0 cung cấp Payment Module Provider và workflow authorize/capture/refund chính thức. Payment Session có thể ở `pending_authorization`, cho phép tạo order trước và xác nhận tiền sau.

## Quyết định

- Dùng `AbstractPaymentProvider`/`ModuleProvider(Modules.PAYMENT, ...)`; không sửa core.
- Milestone hiện tại chỉ tạo QR chuyển khoản động và xác nhận thủ công từ sao kê ngân hàng.
- Amount/currency lấy từ Medusa Payment Collection; immutable reference gắn với payment-session ID; QR có expiry.
- Session/order chờ ở `pending_authorization`; chỉ workflow Admin có RBAC + MFA mới ký confirmation proof, authorize và capture.
- Storefront, return page, ảnh biên lai và Quick Link không có quyền xác nhận thanh toán.
- Mismatch mở manual review issue; không force-capture.
- Support module chỉ sở hữu observation, idempotency receipt và reconciliation issue. Medusa tiếp tục sở hữu Payment Session, Payment, Capture, Refund và Order.
- Refund là luồng thủ công riêng: chỉ ghi refund sau khi có mã giao dịch hoàn tiền thật.
- Reconciliation job không kết nối ngân hàng và không tự sửa financial state.

## Hệ quả

- Milestone dùng được cho development/nội bộ sau khi cấu hình tài khoản nhận, nhưng không chứng minh được thanh toán tự động và chưa production-approved.
- Xác nhận thủ công cần phân quyền Finance/Owner, MFA, quy trình bốn mắt vận hành và SLA review.
- Quick Link chỉ là adapter hiển thị QR; outage không làm thay đổi payment state.
- Khi có API contract thật, thêm adapter/webhook/polling bằng ADR mới; bắt buộc signature/allow-list nếu có, replay protection, amount reconciliation và contract tests. Không thay thế âm thầm manual source-of-truth.

## Không chọn

- Fake webhook hoặc mock bank notification trong runtime.
- Auto-paid từ ảnh biên lai, OCR hoặc browser return URL.
- Client truyền amount/currency/order reference làm nguồn sự thật.
- Gộp authorize/capture/refund thành một cờ `paid` tùy ý.
- Ghi trực tiếp bảng Payment/Order hoặc fork Medusa core.
