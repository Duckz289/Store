# ADR-002: Ranh giới RBAC, MFA step-up và audit evidence

- Trạng thái: Accepted for internal development
- Ngày: 06/08/2026
- Người quyết định: Chủ dự án

## Bối cảnh

Milestone bảo mật cần role matrix, MFA enforcement và audit log nhưng không được sửa core Medusa hoặc dựng lại chức năng framework đã có. Medusa 2.18.0 cài trong repository đã có Auth Module với TOTP/recovery code và RBAC Module/API/dashboard phía sau feature flag `MEDUSA_FF_RBAC`.

Source và type definitions 2.18.0 xác nhận:

- RBAC dùng `rbac_role`, `rbac_policy`, module link user-role và middleware policy chính thức.
- JWT mang danh sách role trong `app_metadata.roles` khi RBAC được bật.
- Auth Module buộc MFA challenge khi một auth identity đã có factor enabled.
- JWT cấp sau MFA challenge không có claim assurance level hoặc `mfa_verified_at`; vì vậy chỉ nhìn JWT không thể chứng minh một session cụ thể vừa hoàn tất MFA.

## Quyết định

### Authentication và RBAC

- Medusa Auth tiếp tục sở hữu identity, session/JWT, TOTP, recovery code và MFA challenge.
- Bật native RBAC bằng `MEDUSA_FF_RBAC=true`; không tạo schema role/permission riêng.
- Đăng ký explicit module export `@medusajs/medusa/rbac` trong `medusa-config.ts`. Kiểm chứng runtime cho thấy chỉ đặt feature flag không đủ trong starter hiện tại: route được bật nhưng migration script báo `RBAC` chưa installed. Cấu hình explicit là extension point package chính thức của đúng bản 2.18.0.
- Role matrix ứng dụng được reconcile bằng workflow/script qua `IRbacModuleService`: Owner, Catalog Manager, Order & Fulfillment, Finance, Support và Read-only Auditor.
- Ma trận liên kết tới policy CRUD đã được Medusa đăng ký. Chỉ `*:read` và `audit_event:read` được khai báo thêm qua extension point `definePolicies()`; seed không tạo policy động vì RBAC 2.18.0 soft-delete policy không có trong registry khi application start.
- Bootstrap Owner yêu cầu email được truyền rõ qua `SECURITY_OWNER_EMAIL`; script idempotent không tự cấp Owner cho toàn bộ user. Local setup truyền đúng `AdminEmail` sau khi seed role.
- `role_super_admin` của Medusa chỉ là bootstrap role. Sau khi Owner được gán và xác minh, môi trường production phải giới hạn số tài khoản còn giữ bootstrap role.
- Policy enforcement dùng `policies` trong `src/api/middlewares.ts` và policies có sẵn trên Admin routes. Không override route core.

### MFA enforcement

- Native MFA enrollment/login vẫn là nguồn sự thật.
- Các Admin mutation và audit export yêu cầu thêm một short-lived step-up assurance gắn với fingerprint SHA-256 của bearer credential hoặc session ID; không lưu raw token/cookie.
- Step-up challenge/verification gọi trực tiếp API công khai của `IAuthModuleService`. Assurance mặc định hết hạn sau 10 phút, có thể cấu hình trong khoảng 1–60 phút.
- Secret API key không thể đạt human MFA step-up và bị chặn ở bề mặt nhạy cảm. Machine-to-machine automation cần policy/boundary riêng trong một ADR sau, không được bypass ngầm.

### Audit evidence

- Custom module `security` sở hữu `security_audit_event` và `security_mfa_assurance`; không có quan hệ DB trực tiếp vào schema core.
- Workflows sở hữu append/list/step-up; API route chỉ xác thực input và chạy workflow.
- Middleware là adapter cross-cutting để quan sát mutation của Admin/Auth core mà không sửa core.
- Subscriber dùng các constant event chính thức của Medusa để ghi lifecycle order, payment/refund, fulfillment, product và inventory. Các event của cùng order dùng correlation ID `lifecycle:order:<order_id>` để truy vết chuỗi end-to-end.
- Audit payload redact password, token, cookie, secret, payment credential, email, phone và address; giới hạn depth, size và số phần tử.
- Mỗi event có correlation ID, actor, action, resource, outcome, timestamp và SHA-256 integrity hash kèm nonce. API không cung cấp update/delete audit event.
- Production database role phải được harden để deny `UPDATE`/`DELETE` trên bảng audit và audit-export phải được gửi sang immutable external storage. Hash tại ứng dụng phát hiện sửa nội dung nhưng một mình nó không ngăn database administrator xóa dòng.

## Hệ quả và giới hạn

- RBAC 2.18.0 còn sau feature flag nên phải giữ compatibility tests khi nâng Medusa và có thể tắt flag để rollback ở development; tắt flag không phải production mitigation chấp nhận được.
- User phải đăng nhập lại sau khi đổi role để JWT mới nhận role list.
- Audit callback của core route chạy khi response kết thúc; lỗi ghi audit được log và phải trở thành alert vận hành. Các security workflow tùy biến ghi audit trong workflow.
- Public Auth API chỉ trả auth identity của challenge sau bước verify. Request dùng challenge của identity khác không bao giờ tạo assurance, nhưng có thể làm challenge bị consume; challenge ID có entropy cao, thời hạn ngắn và endpoint phải có rate limit ở reverse proxy.
- Native RBAC denial có thể xảy ra trước custom audit middleware do thứ tự middleware chính thức; denial vẫn phải có access log ở reverse proxy/SIEM. Không sửa core chỉ để thay đổi thứ tự này.
- ADR này thay đổi boundary trong ADR-001: “RBAC chi tiết” không còn là schema tự xây; nó là cấu hình/mở rộng native RBAC. Phần tự xây chỉ còn step-up assurance và audit evidence.

## Kiểm chứng bắt buộc

- Test role matrix và privilege escalation/horizontal challenge mismatch.
- Test MFA enrollment, expired/revoked assurance, API-key bypass và recovery-code path.
- Test redaction, integrity verification, audit export và không có API mutation audit event.
- Frozen install, lint, typecheck, unit/integration tests, production builds, Store API smoke, Admin auth smoke và production dependency audit.
