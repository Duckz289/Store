# Customer Account Foundation

## Quyết định phạm vi

Customer account là tùy chọn. Guest checkout vẫn là luồng mặc định và không
được yêu cầu đăng nhập. Không có bảng password, session hoặc customer profile
tự xây: Medusa 2.18.0 sở hữu identity, credential và Customer Module sở hữu hồ
sơ cùng địa chỉ đã lưu.

Foundation không tạo module hoặc quan hệ core mới. Notification delivery được
ghi riêng trong [ADR-005](adr/ADR-005-customer-notification-provider.md).

## Audit capability (Medusa 2.18.0 + DTC Starter)

| Nhu cầu | Primitive đang dùng | Quyết định |
| --- | --- | --- |
| Identity và đăng ký | `sdk.auth.register("customer", "emailpass", ...)`, sau đó `sdk.store.customer.create` | Dùng nguyên bản; storefront chỉ kiểm tra dữ liệu và không lưu password. |
| Đăng nhập | `sdk.auth.login("customer", "emailpass", ...)` | Dùng token của Medusa trong cookie HttpOnly, `SameSite=Strict` của storefront. Không dùng Admin actor hoặc Admin session. |
| Đăng xuất | Xóa cookie JWT của storefront và cache tag | JWT là primitive stateless hiện có; không hứa hẹn server-side revoke của token đã bị lộ. |
| Hồ sơ | `GET/PATCH /store/customers/me` | Customer ID luôn do Medusa suy ra từ bearer token, không nhận `customer_id` từ client. |
| Địa chỉ | Store Customer address create/update/delete APIs | Medusa kiểm tra ownership; storefront chỉ gửi address ID của bản ghi mà UI đang hiển thị và server action chuyển tiếp session. |
| Đơn hàng | `GET /store/orders` và route override `/store/orders/:id` | Dùng Store API authenticated customer; route detail extension chạy official `getOrderDetailWorkflow` với `customer_id` lấy từ `auth_context`, không có endpoint storefront query theo `customer_id`. Không tìm thấy order thì trả cùng một trạng thái không tiết lộ ownership/existence. |
| Guest order | Cart/check-out hiện hữu | Không merge theo email/số điện thoại. Cart chỉ transfer khi Medusa xác thực được customer login. Guest tra cứu tiếp tục là flow/capability riêng. |
| Repair | Repair Module link một chiều tới Customer | Chưa thêm customer repair dashboard. Account không đọc bảng Repair, nên không mở rộng bề mặt PII hoặc sửa Repair core. |
| Reset mật khẩu | `sdk.auth.resetPassword` và `sdk.auth.updateProvider` | Dùng token Medusa, không tạo token custom. Medusa phát event `auth.password_reset`; token một lần, tự hết hạn (mặc định 15 phút) và request mới vô hiệu token cũ. |

Nguồn kiểm chứng: type definitions `@medusajs/js-sdk@2.18.0` được cài trong
workspace, `@medusajs/auth-emailpass@2.18.0`, và tài liệu chính thức Medusa
2.18 về customer registration, JS SDK authentication và password reset.

## Boundary bảo mật

- Storefront không tin customer ID, order ID ownership, giá, trạng thái payment
  hay client state. Request có session thiếu/hết hạn được coi là anonymous.
- Source Medusa 2.18.0 cho thấy native list orders đã filter customer nhưng
  native detail orders không tự thêm customer filter. `src/api/store/orders/[id]`
  là route override chính thức: yêu cầu `authenticate("customer")` và truyền
  `req.auth_context.actor_id` vào `getOrderDetailWorkflow`. Không sửa core.
- Login và đăng ký trả thông báo chung; không phản chiếu raw backend error,
  password hoặc token.
- Email reset luôn trả thông báo chung. Workspace hiện có Notification Module
  provider sandbox và subscriber chính thức cho `auth.password_reset`; sandbox
  chỉ ghi delivery record vào `.local` bị ignore để kiểm thử và không log
  token/reset URL. Provider SendGrid chính thức có thể chọn bằng env khi có
  credential sandbox, nhưng milestone vẫn **chưa production-approved** vì
  cần provider thật, shared rate limit và observability theo deployment.
- Địa chỉ Việt Nam dùng country code `vn`, không hard-code quận/huyện. Các
  trường bắt buộc và giới hạn độ dài được kiểm tra trong server action trước
  khi gọi Store API.
- Không đưa password, reset token, JWT hay PII đầy đủ vào audit log. Account
  customer không dùng primitive MFA/RBAC dành cho Admin.

## UI và route

Route hiện hữu của DTC Starter được giữ để tránh duplicate App Router routes:

- `/account`: login hoặc overview tùy session.
- `/account/profile`, `/account/addresses`, `/account/orders` và
  `/account/orders/details/[id]`: bề mặt authenticated customer.
- `/account/forgot-password` và `/account/reset-password`: recovery UI. Reset
  page chỉ hoạt động với token do Medusa phát hành qua notification provider
  đã được cấu hình.

Account route không bắt guest checkout. Customer order history dùng phân trang
server-side; khi không có đơn, UI trả empty state thay vì suy đoán dữ liệu.

## Hạn chế/việc tiếp theo có chủ đích

1. Rate limit trong workspace chỉ là in-memory guard cho development; production
   cần reverse proxy hoặc layer chống abuse có trạng thái dùng chung.
2. Email delivery/reset end-to-end vẫn cần chọn provider thật và
   credential/template ngoài source. Không giả lập webhook hay tự gửi token.
3. Customer repair history cần endpoint serializer riêng, ownership test và
   privacy review; không nối trực tiếp vào Repair Module trong milestone này.
