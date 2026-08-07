# Bàn giao vận hành cửa hàng

Tài liệu này dành cho chủ shop vận hành bản cơ bản. Không chứa mật khẩu, khóa API hay số tài khoản ngân hàng.

## Khởi động local

1. Bảo đảm PostgreSQL local đang chạy ở `localhost:5433`.
2. Tại thư mục dự án, chạy `./scripts/start-local.ps1`.
3. Mở Storefront: `http://localhost:8010/vn/`; mở Admin: `http://localhost:9000/app`.

Chỉ dùng `scripts/setup-local.ps1` khi cần tạo lại môi trường local. Không chạy lệnh xoá database hoặc sửa database bằng SQL trong lúc vận hành.

## Đăng nhập Admin

Mở `/app`, dùng tài khoản Admin do người triển khai bàn giao và mã MFA đang hoạt động. Mật khẩu, recovery code và mã MFA không được lưu trong tài liệu, chat hoặc ticket.

Nếu không còn mã MFA, Owner phải xử lý theo quy trình khôi phục quản trị; không tạo tài khoản Admin mới để vượt qua kiểm soát quyền.

## Sản phẩm, giá và tồn kho

- Vào **Products** để thêm hoặc sửa sản phẩm, ảnh, mô tả, danh mục và biến thể.
- Mỗi biến thể phải có SKU riêng trước khi mở bán.
- Sửa giá trong phần **Variants / Prices** của sản phẩm; kiểm tra đúng region VND và sales channel trước khi lưu.
- Vào **Inventory** để điều chỉnh tồn kho tại stock location đang dùng. Ghi lý do nội bộ cho mọi điều chỉnh và không sửa bảng database trực tiếp.
- Sau thay đổi quan trọng, kiểm tra lại trang sản phẩm và thêm thử một biến thể vào giỏ hàng.

## Đơn hàng, COD và khách hàng

- Vào **Orders** để xem đơn và trạng thái fulfillment/payment. Tìm đơn theo mã đơn hoặc email khách.
- Với COD, đơn được tạo nhưng không được coi là đã thu tiền. Chỉ cập nhật theo tiền thực tế thu được và quy trình giao nhận của shop.
- Vào **Customers** để xem hồ sơ và lịch sử mua của khách. Chỉ xem hoặc sửa dữ liệu khi có mục đích vận hành hợp lệ.
- Admin có thể xem sản phẩm, tồn kho, khách và đơn sau khi đăng nhập MFA; quyền Finance/Owner cần MFA step-up cho thao tác tài chính nhạy cảm.

## Xác nhận VietQR

VietQR hiện **tắt** trong cấu hình local vì chưa có thông tin nhận tiền thật được phê duyệt. Không bật bằng số tài khoản hoặc secret giả.

Khi đã được triển khai an toàn, Finance/Owner có MFA sẽ đối chiếu sao kê ngân hàng với **đúng số tiền, nội dung chuyển khoản và thời gian hiệu lực** do backend tạo. Xác nhận cùng một giao dịch là idempotent. Sai số tiền, sai nội dung hoặc thanh toán sau hạn phải giữ ở manual review; không tự đánh dấu paid và không sửa Payment/Order bằng SQL. Xem quy trình chi tiết tại `docs/runbooks/vietqr-reconciliation.md`.

## Khôi phục mật khẩu khách

Khách vào `/vn/account/forgot-password`, nhập email và nhận hướng dẫn đặt lại mật khẩu. Phản hồi luôn chung chung để không lộ email nào có tài khoản.

Ở local, email được ghi vào sandbox outbox để kiểm thử; khi deploy phải cấu hình nhà cung cấp email thật. Không gửi token reset qua chat, log hay ticket.

## Không tự sửa

- Không sửa `.env`, secret, khóa API hoặc MFA key trên máy đang chạy; thay đổi phải qua secret manager/quy trình triển khai.
- Không sửa package lockfile thủ công, Medusa core, `.medusa/`, `.next/`, `dist/` hoặc migration đã chạy.
- Không dùng SQL trực tiếp để đổi đơn, thanh toán, tồn kho hay quyền.
- Không bật VietQR, email production, Redis, dịch vụ vận chuyển hoặc payment provider khi chưa có credential và runbook đã phê duyệt.

## Backup và restore

Production phải dùng PostgreSQL managed có backup mã hóa và point-in-time recovery. Thiết lập backup tự động, giữ bản backup theo chính sách của shop, và diễn tập restore vào database tách biệt trước khi go-live. Với local Docker, xuất backup trước khi nâng cấp hay thay đổi dữ liệu lớn; chỉ restore vào môi trường local/test đã được xác nhận đúng đích.

Mọi backup chứa dữ liệu khách hàng phải được mã hóa, giới hạn người truy cập và không gửi qua chat/email thông thường.

## Biến môi trường khi deploy

Thiết lập trong kho secret của môi trường backend, không commit vào Git:

| Nhóm | Biến cần cấu hình |
|---|---|
| Core | `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `AUTH_MFA_ENCRYPTION_KEY`, `MEDUSA_FF_RBAC`, `MFA_STEP_UP_TTL_SECONDS` |
| URL/CORS | `STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`, `STOREFRONT_URL`, `STOREFRONT_DEFAULT_COUNTRY` |
| Email | `NOTIFICATION_PROVIDER`, `SENDGRID_API_KEY`, `SENDGRID_FROM` |
| VietQR (chỉ khi được duyệt) | `VIETQR_ENABLED`, `VIETQR_BANK_BIN`, `VIETQR_ACCOUNT_NUMBER`, `VIETQR_ACCOUNT_NAME`, `VIETQR_CONFIRMATION_SECRET`, `VIETQR_EXPIRY_MINUTES`, `VIETQR_QR_TEMPLATE` |
| Storefront | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_DEFAULT_REGION`, `NEXT_PUBLIC_BASE_URL`, `NODE_ENV` |

`NOTIFICATION_OUTBOX_PATH` và `NOTIFICATION_SANDBOX_FAILURE` chỉ phù hợp local/test. Không dùng `sandbox` email hoặc origin `localhost` ở production.
