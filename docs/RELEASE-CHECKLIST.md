# Release checklist — bản cơ bản

## Passed

- Frozen install, lint, typecheck, backend unit tests, module integration tests và HTTP integration tests đã pass.
- Backend/Admin build và storefront build đã pass.
- Runtime local đã trả HTTP 200 cho Backend/Admin và Storefront.
- Store API smoke đã xác nhận region `vn`, tiền tệ `vnd`, 4 sản phẩm seed, SKU biến thể, giá VND phía server, hai mức shipping và COD.
- Guest checkout, authenticated checkout, idempotency completion và inventory race guard đã pass bằng smoke API; COD không tự capture payment.
- UI checkout đã kiểm tra ở local: form địa chỉ, validation native, loading/disabled state, shipping, COD và review step. Responsive 390, 768, 1024 và 1440 không còn root horizontal overflow tại homepage, listing, PDP và cart.
- Data readiness đã xác nhận region VND, sales channel, shipping option, stock location, inventory, categories, products, variants, SKU và pricing. Seed dừng an toàn khi bộ dữ liệu hoàn chỉnh đã tồn tại và fail rõ ràng với trạng thái dữ liệu một phần.
- Bộ test security (auth, MFA, RBAC, audit redaction, ownership, idempotency và inventory race) đã pass trong unit/module/HTTP suites.
- Production dependency audit ngày 2026-08-07 giữ nguyên baseline: 0 critical, 6 high, 11 moderate, 0 low; không có advisory mới.
- VietQR provider chỉ được đăng ký khi `VIETQR_ENABLED=true`; test/module/HTTP đã xác nhận pending session, backend-owned amount/reference/expiry, manual confirmation, idempotency và manual-review outcomes.

## Production configuration audit

| Hạng mục | Trạng thái | Kết luận |
|---|---|---|
| Validation cấu hình backend | READY | Backend fail fast nếu notification provider không hợp lệ hoặc thiếu biến bắt buộc của SendGrid. |
| Secrets | NEEDS_CONFIG | Local secret không được tái sử dụng; chuyển `JWT_SECRET`, `COOKIE_SECRET`, MFA encryption key, DB password và provider secret vào secret manager. |
| Database | NEEDS_CONFIG | `localhost:5433` chỉ phù hợp local; production cần Postgres TLS, backup/PITR, least privilege và restore drill. |
| CORS, cookie và session | NEEDS_CONFIG | Local origin đang đúng cho smoke; thay bằng allowlist HTTPS thật và xác minh reverse proxy/cookie production. |
| Admin credentials và MFA | NEEDS_CONFIG | Owner phải nhận bàn giao credential ngoài Git, bật MFA bắt buộc và kiểm tra quyền trước go-live. |
| Storefront/backend URLs | NEEDS_CONFIG | Thay các URL `localhost` trong biến backend/storefront bằng domain HTTPS thật. |
| Password reset | NEEDS_CONFIG | Luồng native, redaction và one-time token đã test; production còn cần sender/domain email, shared rate limit và theo dõi delivery. |
| Notification provider | BLOCKED_FOR_PRODUCTION | `sandbox` đang hoạt động đúng cho local nhưng không gửi email thật; phải cấu hình provider/credential đã được duyệt. |
| COD | READY | Provider mặc định, guest/auth checkout và trạng thái chưa capture đã được smoke local. |
| VietQR | BLOCKED_FOR_PRODUCTION | Provider giữ disabled khi chưa có tài khoản nhận tiền thật và confirmation secret đã được phê duyệt. |
| Logging và error handling | NEEDS_CONFIG | Audit/redaction và generic failure đã test; còn thiếu logging có cấu trúc, error monitoring và alert theo môi trường production. |
| Security advisories | BLOCKED_FOR_PRODUCTION | 0 critical; 6 high và 11 moderate đang là exception development, chưa phải production approval. |

## Needs production configuration

- Thay toàn bộ local secret bằng secret manager, xoay vòng secret, và thiết lập PostgreSQL production có TLS, backup mã hóa, point-in-time recovery và restore drill.
- Đặt URL storefront/backend/Admin thật; CORS phải là allowlist origin HTTPS thật, không dùng `localhost` hay wildcard. Reverse proxy phải dùng TLS và cookie/session phù hợp production.
- Tạo/chuyển giao Admin Owner, bắt buộc MFA, kiểm tra RBAC tối thiểu và lưu recovery code ngoài repository.
- Cấu hình `NOTIFICATION_PROVIDER=sendgrid` cùng sender/domain đã xác thực, credential thật, template review và delivery monitoring. Sandbox email chỉ dùng local/test.
- Bổ sung rate limit dùng chung ở edge/Redis trước khi chạy nhiều backend instance; limiter recovery hiện tại chỉ là in-memory cho local.
- Bổ sung structured logging, error monitoring, alert thanh toán/tồn kho, retention và incident runbook theo môi trường triển khai.
- Rà lại dữ liệu local lịch sử: seed mới không sinh trùng, nhưng các sales channel/API key/store trùng đã tồn tại từ trước không bị xoá tự động vì có thể đang được tham chiếu.
- Thực hiện production risk acceptance riêng hoặc đóng 6 high advisory và 11 moderate advisory còn lại; exception development hiện tại không phải production approval.

## Blocked for production

- VietQR runtime vẫn tắt: thiếu tài khoản nhận tiền thật đã phê duyệt và `VIETQR_CONFIRMATION_SECRET` độc lập. Không dùng credential/số tài khoản giả để bật. Khi có cấu hình được duyệt, chạy lại VietQR smoke và manual-finance reconciliation trước go-live.
- Live Admin MFA step-up không thể được tự động hoàn tất vì TOTP đang hoạt động không được xuất/ghi lại; cần Owner đăng nhập bằng mã hiện tại để thực hiện bước xác nhận cuối cùng trên `/app`.
- Không có production deployment trong scope; `docker-compose.yml` và cấu hình local không phải cấu hình production.

## Deferred / out of scope

- VNPay
- carrier API
- custom analytics dashboard
- loyalty
- wishlist
- reviews
- SMS
- custom Admin redesign
- advanced monitoring
- multi-warehouse expansion
