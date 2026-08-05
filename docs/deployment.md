# Ghi chú triển khai

Chưa có production deployment trong milestone scaffold này.

Dependency audit hiện chưa đạt production gate; xem [security-audit.md](security-audit.md).

## Topology đề xuất

- Medusa backend/Admin chạy container hoặc dịch vụ Node lâu dài, phía sau TLS reverse proxy.
- Storefront Next.js triển khai độc lập và chỉ dùng publishable API key ở client.
- PostgreSQL managed có point-in-time recovery, backup mã hóa và restore drill.
- Object storage riêng cho upload; xác minh MIME/magic bytes, giới hạn kích thước và quét malware.
- Redis chỉ thêm khi cấu hình cache/event/workflow runtime thực sự cần; production nhiều instance không dùng in-memory coordination.

## Gate trước production

- Thay toàn bộ local secrets; cấu hình secret manager và rotation.
- CORS allowlist theo origin thật, không wildcard; TLS và secure cookie.
- Bật/enforce MFA cho admin, hoàn thiện RBAC tối thiểu quyền và audit log bất biến.
- Test idempotency checkout/payment/webhook, oversell concurrency và coupon atomic claim.
- Thêm rate limit, structured logging, tracing, error monitoring và cảnh báo payment/stock bất thường.
- Hoàn thiện privacy retention/export/delete, backup restore và incident runbook.
- Contract/security test các provider VietQR, VNPay và vận chuyển.
- Dependency/SCA, secret scan và image scan phải pass.

`docker-compose.yml` chỉ dành cho local; không dùng trực tiếp làm cấu hình production.
