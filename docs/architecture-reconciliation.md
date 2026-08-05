# Architecture Reconciliation: Bagisto và Medusa

Ngày đánh giá: 05/08/2026

Tài liệu này đối chiếu các nguyên tắc M01–M15 với hai framework mã nguồn mở chính thức. `PLAN.md` và `docs/modules/*` tiếp tục là learning notes, decision history và checklist nghiệp vụ/kiểm thử. Chúng không còn bắt buộc tự xây commerce engine hay chặn scaffold.

## Ký hiệu

- **Native**: dùng chức năng framework và data model hiện có.
- **Config**: bật hoặc cấu hình trong Admin/environment.
- **Extend**: viết package/module/provider/workflow/subscriber qua extension point chính thức.
- **Custom**: tính năng riêng của cửa hàng, phải tự xây nhưng không sửa core.
- **Superseded**: quyết định triển khai cũ không còn áp dụng.

## Kết luận

Chọn **Medusa v2 DTC Starter** tại commit `1fc1edd6c91f4992b89750b6d5cd39bc9baed503` trên nhánh `main`.

Bagisto 2.4 đáp ứng tốt ưu tiên một repository có storefront, admin và commerce backend. Tuy nhiên, Bagisto chính thức yêu cầu MySQL (`ext-pdo_mysql`, MySQL 8.0.32+) và PHP `>=8.3 <8.5`. Đây là xung đột nghiêm trọng với yêu cầu PostgreSQL và máy phát triển hiện có PHP 8.5.5. Không nên port Bagisto sang PostgreSQL vì việc đó đi ngược nguyên tắc không sửa core và làm tăng rủi ro migration/query/index.

Medusa DTC Starter hiện cũng là một repository monorepo hoàn chỉnh: `apps/backend` chứa Medusa v2 và Admin; `apps/storefront` chứa storefront Next.js. Starter yêu cầu Node.js 20+, PostgreSQL 15+ và pnpm 10+; repository đang chạy Node.js 24.14.0 và pnpm 10.11.1 qua Corepack. Medusa 2.18 còn có MFA/TOTP chính thức, Commerce Modules, workflows có rollback, payment providers và fulfillment providers.

Nguồn chính:

- [Bagisto repository và MIT license](https://github.com/bagisto/bagisto)
- [Bagisto system requirements](https://devdocs.bagisto.com/getting-started/before-you-start.html)
- [Bagisto package architecture](https://devdocs.bagisto.com/architecture/backend.html)
- [Bagisto package development](https://devdocs.bagisto.com/package-development/getting-started.html)
- [Medusa DTC Starter](https://github.com/medusajs/dtc-starter)
- [Medusa Commerce Modules](https://docs.medusajs.com/resources/commerce-modules)
- [Medusa custom features](https://docs.medusajs.com/learn/customization/custom-features)
- [Medusa MFA](https://docs.medusajs.com/resources/commerce-modules/auth/mfa)
- [Medusa inventory reservation lifecycle](https://docs.medusajs.com/resources/commerce-modules/inventory/reservations-lifecycle)
- [Medusa fulfillment provider](https://docs.medusajs.com/resources/commerce-modules/fulfillment/fulfillment-provider)
- [Medusa big-number money model](https://docs.medusajs.com/learn/fundamentals/data-models/big-numbers)

## So sánh năng lực sản phẩm

| Năng lực | Bagisto 2.4 | Medusa v2 DTC Starter | Quyết định |
|---|---|---|---|
| Storefront | Native Laravel Blade/Vue, responsive theme | Native Next.js storefront trong cùng monorepo | Medusa native, Việt hóa theme |
| Admin | Native, cùng ứng dụng | Native, được cài cùng backend tại `/app` | Medusa native + widget/route khi cần |
| Catalog/variant/SKU | Native Product/Category/Attribute packages | Native Product Module | Dùng Medusa, không tái tạo schema M03 |
| Inventory | Native, multi-warehouse; cần race test | Native Inventory/Stock Location/Reservation; reservation tạo khi complete cart | Dùng core flow; bổ sung audit ledger nếu cần |
| Pricing/promotion | Native catalog/cart rules | Native Pricing/Promotion Modules | Dùng core, kiểm thử rule M05 |
| Cart/checkout | Native Checkout package | Native Cart Module + DTC checkout | Dùng core flow, không tin giá từ browser |
| Order | Native Sales package | Native Order Module, order changes/returns/exchanges | Dùng core snapshots/versioning |
| Payment | Payment package, custom method package | Payment Module Provider, deferred authorization, webhook retries | Manual/COD config; VietQR/VNPay provider riêng |
| Fulfillment | Shipping carrier extension | Manual provider + custom Fulfillment Provider | Manual trước; carrier Việt Nam sau |
| Customer | Native account/address/order | Native Customer Module + DTC account/order history | Dùng native |
| Repair service | BookingProduct/RMA giúp giảm phạm vi nhưng workflow sửa chữa vẫn riêng | Custom module + workflow + API + Admin extensions | Tự xây bounded context `repair`, link mềm với customer/order |
| RBAC | ACL native | User/invite native; quyền chi tiết cần extension/policy | Extend Medusa cho owner/staff |
| MFA | Có dependency Google2FA nhưng cần xác minh enforcement/UI | MFA/TOTP/recovery code native từ v2.15.5 | Config Medusa và bắt buộc cho admin |
| Audit log | Cần custom/package | Cần custom module/subscribers | Custom append-only audit |
| Search/SEO | Search, sitemap, optional Elasticsearch | DTC browsing; search/SEO cần hoàn thiện trong storefront | Custom nhẹ bằng PostgreSQL trước |
| Privacy | GDPR package, vẫn cần luật Việt Nam | Custom consent/retention/anonymization | Custom theo M14 |
| Database | MySQL bắt buộc | PostgreSQL 15+ | Medusa thắng quyết định |
| Extension model | Laravel package/events/render hooks | Modules/workflows/providers/subscribers/Admin widgets | Cả hai tốt; Medusa khớp PostgreSQL và invariants hơn |

## Ánh xạ M01–M15

| Module học | Bagisto | Medusa | Cách áp dụng được chọn |
|---|---|---|---|
| M01 Request/module boundaries | Laravel packages, controllers, events, queues | Commerce Modules, workflows, file-based API, subscribers | **Native + Extend**. Route chỉ validate/authorize và chạy workflow; không viết business logic trong route/UI |
| M02 Auth/MFA/RBAC | Admin/User + ACL; MFA cần kiểm chứng cấu hình | Auth/User native, MFA/TOTP native; RBAC chi tiết chưa phải invariant core | **Config + Extend**. Bật MFA; xây policy owner/staff bằng module/middleware |
| M03 Catalog | Product/Category/Attribute native | Product Module native | **Native**. Dùng product, option, variant, SKU, category, collection; không tạo schema cũ |
| M04 Inventory | Inventory/multi-warehouse native | Inventory, stock location và reservation native | **Native + Extend**. Dùng `completeCartWorkflow`; thêm stock audit/reconciliation subscriber, race tests |
| M05 Pricing/promotion/coupon | CatalogRule/CartRule native | Pricing/Promotion native | **Native + Config**. Dùng promotion code/rules; kiểm concurrency và snapshot bằng tests |
| M06 Cart/checkout | Checkout native | Cart + DTC checkout native | **Native + Extend**. Việt hóa địa chỉ, rate limit và idempotency ở ranh giới checkout |
| M07 Order/fulfillment | Sales/order/invoice/shipment/refund native | Order/fulfillment/return/exchange native | **Native + Config**. Map trạng thái hiển thị tiếng Việt, không tạo state tables song song |
| M08 Payment | Payment extension point | Payment Provider + payment workflows/webhooks | **Config + Extend**. Manual provider cho COD; custom VietQR/VNPay, không tin redirect |
| M09 Repair | Booking/RMA có thể tái dùng một phần | Không phải commerce core | **Custom**. Module `repair` riêng, workflow và Admin UI; không nhét repair vào Order core |
| M10 Admin/audit | Admin + ACL native, audit riêng | Admin native, widgets/routes native, audit riêng | **Native + Custom**. Giữ Admin; thêm append-only audit/subscribers |
| M11 Jobs/notifications | Laravel queue/scheduler/events | Scheduled jobs/subscribers/event bus | **Native + Extend**. Notification, timeout và reconciliation qua job/subscriber idempotent |
| M12 Search/SEO | Search/sitemap native | Storefront cần search/metadata/sitemap | **Config + Custom**. PostgreSQL search quy mô nhỏ; Next metadata/sitemap/robots |
| M13 Media security | Media/image pipeline của Laravel cần hardening | File provider; validation/re-encode cần bổ sung | **Extend**. Validate magic bytes, re-encode, giới hạn và tách public/private |
| M14 Privacy/compliance | GDPR package hỗ trợ, luật VN vẫn riêng | Không có compliance VN | **Custom**. Consent, retention, data map, policy và legal checklist |
| M15 Monitoring/backup/DR | Hạ tầng Laravel/MySQL riêng | Hạ tầng Node/PostgreSQL riêng | **Custom/Ops**. Health check, structured logs, backup PostgreSQL/storage, restore drill |

## Ma trận dùng lại và tự xây

| Nhóm | Nội dung |
|---|---|
| Dùng nguyên framework | Product, variant, SKU, category, collection, price lists, promotions, cart, checkout workflow, customer/account/address, order, returns/exchanges, inventory levels/reservations, stock locations, regions, currencies, Admin |
| Chỉ cấu hình | Region Việt Nam, currency VND, country `vn`, sales channel, publishable API key, CORS allowlist, Manual Payment Provider cho COD, Manual Fulfillment Provider, shipping option cố định/freeship rule |
| Mở rộng bằng provider/workflow/subscriber | VietQR, VNPay, carrier Việt Nam, địa chỉ hành chính, checkout idempotency/rate limiting, stock movement audit, order/payment/fulfillment labels và notifications |
| Phải tự xây | Repair bounded context, audit log nghiệp vụ, owner/staff RBAC chi tiết, consent/retention VN, backup/restore automation, monitoring/alerts, search/SEO hoàn thiện, upload quarantine |
| Không còn áp dụng | Supabase Auth/RLS/service-role key, Drizzle schema tự thiết kế, schema Catalog/Inventory/Pricing/Cart/Order cũ, một Next.js app duy nhất, Vercel Cron bắt buộc, Supabase là runtime/DB chính, Admin tự xây, gate học đủ M01–M15 trước scaffold |

## Quy tắc tích hợp

1. Core Medusa và schema commerce là nguồn sự thật; không sao chép schema minh họa trong M01–M15.
2. Business logic mới đi qua custom module và workflow; API routes chỉ là adapter.
3. Payment và shipping tích hợp bằng provider chính thức.
4. Cross-domain data dùng module links hoặc metadata có kiểm soát; không FK thẳng vào bảng nội bộ nếu có extension point.
5. Subscriber xử lý side effect sau commit; mọi handler có idempotency.
6. Tiền theo Medusa 2.18 là major currency unit và `bigNumber`. Với VND, `22.990.000₫` là `22990000`; phép tính custom dùng `MathBN`, không dùng số thực JavaScript.
7. M01–M15 là acceptance checklist: các invariant chưa được framework chứng minh phải có integration/race/security test.
