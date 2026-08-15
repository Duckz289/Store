# Hưng Phát Custom Admin

Frontend quản trị độc lập, không sử dụng Medusa Admin UI extensions.

- Development: `corepack pnpm --filter @dtc/admin run dev`
- URL: `http://localhost:8020/admin`
- Medusa Admin fallback: `http://localhost:9000/app`

Ứng dụng chỉ giao tiếp với Medusa Admin API và custom backend APIs/workflows.
Không kết nối hoặc ghi trực tiếp PostgreSQL.

## Phân quyền vận hành

- `System Owner`: chỉ một tài khoản, có quyền cao nhất với nhân viên, phân quyền,
  audit log và sức khỏe hệ thống.
- `Owner`: toàn quyền nghiệp vụ cửa hàng (sản phẩm, đơn, kho, khuyến mãi, sửa
  chữa và khách hàng), nhưng không được thay đổi quyền hệ thống.
- Màn hình `/admin/system` hiển thị health checks, request tracer và audit gần
  nhất. Các endpoint nhạy cảm yêu cầu đăng nhập, System Owner và MFA step-up.

Thiết lập tài khoản duy nhất bằng `SYSTEM_OWNER_EMAIL`, sau đó chạy
`corepack pnpm --filter @dtc/backend run security:bootstrap-owner`. Workflow này
đảm bảo chỉ email cấu hình giữ vai trò System Owner và chuyển vai trò Super Admin
cũ về Owner.
