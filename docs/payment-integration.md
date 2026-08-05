# Tích hợp thanh toán Việt Nam

## Hiện có: COD

Region Việt Nam bật provider hệ thống `pp_system_default`. Storefront hiển thị nó là “Thanh toán khi nhận hàng (COD)”. Đây là deferred/manual payment: đặt đơn không được hiểu là đã thu tiền online; nhân viên chỉ capture/đánh dấu thanh toán theo quy trình đối soát COD.

## VietQR

VietQR nên là custom Payment Provider hoặc payment module riêng:

- Tạo nội dung chuyển khoản duy nhất theo payment session/order.
- Lưu amount, ngân hàng đích, nội dung, thời hạn và trạng thái ở module riêng.
- Chỉ backend sinh QR payload; storefront không quyết định số tiền.
- Webhook/đối soát dùng idempotency key của đối tác và unique constraint logic trong module.
- Chuyển payment sang authorized/captured chỉ sau xác minh server-to-server.

## VNPay

VNPay triển khai bằng Payment Provider chính thức của Medusa:

- `initiatePayment` tạo URL có chữ ký và return URL.
- IPN/webhook xác minh chữ ký, merchant, amount, currency và transaction reference.
- Callback trình duyệt chỉ hiển thị kết quả; IPN đã xác minh mới là nguồn sự thật.
- `authorizePayment`, `capturePayment`, `refundPayment` và `cancelPayment` phải ánh xạ rõ vào state machine của Medusa.
- Mỗi event lưu external transaction ID và chống xử lý lặp.

Không đặt secret VNPay/VietQR vào biến `NEXT_PUBLIC_*`. Trước production cần contract test với sandbox, replay test webhook, test amount mismatch và test timeout/retry.
