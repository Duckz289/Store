# ADR-001: Chuyển từ custom commerce sang Medusa v2

- Trạng thái: Accepted
- Ngày: 05/08/2026
- Người quyết định: Chủ dự án

## Bối cảnh

Kế hoạch ban đầu dùng một ứng dụng Next.js + Supabase và tự thiết kế Catalog, Inventory, Pricing, Cart, Order, Admin và Auth. M01–M15 được viết để học nghiệp vụ và nhận diện invariant/rủi ro, không phải yêu cầu phải tự xây commerce engine.

Mục tiêu mới là dùng một framework thương mại điện tử mã nguồn mở chính thức, giữ các nguyên tắc nghiệp vụ và kiểm thử trong M01–M15.

## Các lựa chọn

### Bagisto 2.4

Ưu điểm:

- Một Laravel repository hoàn chỉnh có storefront, Admin và commerce packages.
- Catalog, inventory, checkout, sales, marketing, customer, booking/RMA, payment và shipping có sẵn.
- Package, event listener, view-render event và carrier/payment class là extension points rõ.
- MIT license.

Hạn chế quyết định:

- Official code yêu cầu `ext-pdo_mysql`; official installation yêu cầu MySQL 8.0.32+.
- Official code yêu cầu PHP `>=8.3 <8.5`, trong khi máy hiện có PHP 8.5.5.
- Chuyển core sang PostgreSQL sẽ tạo fork sâu và vi phạm nguyên tắc không sửa core.

### Medusa v2 DTC Starter

Ưu điểm:

- Official monorepo đã bao gồm backend, storefront Next.js đầy đủ và Admin được cài cùng backend.
- PostgreSQL 15+, Node.js 20+ và pnpm 10+ đúng yêu cầu nền và toolchain hiện có.
- Commerce Modules bao phủ product, pricing, promotion, cart, customer, order, inventory, payment, fulfillment và region.
- Workflows có rollback/retry; provider interfaces phù hợp VNPay/GHN/GHTK; custom modules phù hợp Repair.
- MFA/TOTP và recovery codes có sẵn từ Medusa v2.15.5.
- MIT license.

Đánh đổi:

- Storefront và backend là hai app trong monorepo, dù vẫn là một repository và chạy chung bằng một lệnh.
- Repair, RBAC chi tiết, audit, compliance Việt Nam và carrier/payment Việt Nam vẫn cần extension.
- Search/SEO và upload hardening cần hoàn thiện ở storefront/backend.

## Quyết định

Chọn **Medusa v2 DTC Starter**, nhánh `main`, commit `1fc1edd6c91f4992b89750b6d5cd39bc9baed503`.

Không port Bagisto sang PostgreSQL. Không tái tạo schema commerce cũ. Không sửa trực tiếp Medusa core khi có module, workflow, provider, subscriber, module link hoặc Admin extension.

## Hệ quả

- `apps/backend`: Medusa v2 backend và Admin.
- `apps/storefront`: Next.js storefront chính thức.
- PostgreSQL là database chính.
- M01–M15 tiếp tục là learning notes và checklist review/test.
- Quyết định Supabase Auth, RLS, custom commerce schema, custom Admin và single Next.js app được đánh dấu superseded.
- Việc scaffold không còn chờ M06–M15 được duyệt.

## Ranh giới mở rộng

- `repair`: custom module/workflows/API/Admin routes.
- `vnpay` và `vietqr`: payment providers/workflows với signature, idempotency và reconciliation.
- Carrier Việt Nam: fulfillment providers và address mapping adapter.
- Audit/security/privacy/monitoring: cross-cutting modules/subscribers và hạ tầng vận hành.
