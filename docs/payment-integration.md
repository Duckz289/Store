# Tích hợp thanh toán Việt Nam

## Hiện có: COD

Region Việt Nam bật provider hệ thống `pp_system_default`. Storefront hiển thị nó là “Thanh toán khi nhận hàng (COD)”. Đây là deferred/manual payment: đặt đơn không được hiểu là đã thu tiền online; nhân viên chỉ capture/đánh dấu thanh toán theo quy trình đối soát COD.

## VietQR

Thiết kế được chốt tại `docs/vietqr-payment-design.md` và ADR-004. Workspace hiện không có provider API/webhook contract, vì vậy Milestone 3 dùng custom Payment Provider với QR động và xác nhận thủ công:

- Tạo nội dung chuyển khoản duy nhất theo payment session/order.
- Amount/currency lấy từ Payment Collection của Medusa; reference, ngân hàng đích, nội dung và thời hạn được snapshot trong Payment Session.
- Chỉ backend sinh QR payload; storefront không quyết định số tiền.
- Payment giữ `pending_authorization` sau khi đặt order; Finance/Owner kiểm tra sao kê ngân hàng và xác nhận qua workflow RBAC + MFA.
- Không có webhook/polling giả, không auto-paid từ return URL hoặc ảnh biên lai. Quick Link chỉ hiển thị QR.
- Mismatch, expiry và duplicate mở reconciliation issue; transition authorize/capture/refund tách biệt và idempotent.
- Khi có provider contract thật, webhook/polling phải dùng signature/allow-list nếu được hỗ trợ, replay protection và amount reconciliation trước khi trở thành nguồn xác nhận server-to-server.

## VNPay

VNPay triển khai bằng Payment Provider chính thức của Medusa:

- `initiatePayment` tạo URL có chữ ký và return URL.
- IPN/webhook xác minh chữ ký, merchant, amount, currency và transaction reference.
- Callback trình duyệt chỉ hiển thị kết quả; IPN đã xác minh mới là nguồn sự thật.
- `authorizePayment`, `capturePayment`, `refundPayment` và `cancelPayment` phải ánh xạ rõ vào state machine của Medusa.
- Mỗi event lưu external transaction ID và chống xử lý lặp.

Không đặt secret VNPay/VietQR vào biến `NEXT_PUBLIC_*`. Trước production cần contract test với sandbox, replay test webhook, test amount mismatch và test timeout/retry.
