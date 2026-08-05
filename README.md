# Điện Tử Hưng Phát Commerce

Nền tảng thương mại điện tử Việt Nam được scaffold từ [Medusa DTC Starter](https://github.com/medusajs/dtc-starter) tại commit `1fc1edd6c91f4992b89750b6d5cd39bc9baed503`.

Repository gồm:

- `apps/backend`: Medusa v2 backend và Admin (`http://localhost:9000/app`).
- `apps/storefront`: Next.js storefront (`http://localhost:8010`; cổng 8000 đang được dịch vụ khác trên máy sử dụng).
- PostgreSQL 16 chạy bằng Docker Compose.
- Seed Việt Nam: VND, vùng Việt Nam, kho chính, COD, phí giao tiêu chuẩn và bốn nhóm hàng điện tử.

## Bắt đầu nhanh trên Windows

Yêu cầu: Node.js 20+, Corepack, Docker Desktop và Git.

```powershell
corepack enable
./scripts/setup-local.ps1
./scripts/start-local.ps1
```

`setup-local.ps1` tạo secret ngẫu nhiên trong các file bị Git bỏ qua, chạy migration/seed và tạo tài khoản admin local với mật khẩu mạnh tại `.local/admin-credentials.txt`. Không commit file này.

Nếu muốn thiết lập thủ công, xem [Hướng dẫn local](docs/local-development.md).

## Lệnh chính

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm test
corepack pnpm run test:smoke
corepack pnpm build
corepack pnpm run backend:dev
corepack pnpm run storefront:dev
```

## Quyết định kiến trúc

- [Architecture Reconciliation](docs/architecture-reconciliation.md)
- [ADR-001: Chuyển từ custom commerce sang Medusa v2](docs/adr/ADR-001-adopt-medusa-v2.md)
- [Kiến trúc triển khai](docs/architecture.md)
- [Tích hợp thanh toán Việt Nam](docs/payment-integration.md)
- [Tích hợp vận chuyển Việt Nam](docs/shipping-integration.md)
- [Ghi chú triển khai](docs/deployment.md)
- [Security audit hiện tại](docs/security-audit.md)

`PLAN.md`, `docs/GLOSSARY.md` và các tài liệu M01–M15 vẫn là learning notes, checklist nghiệp vụ/kiểm thử và decision history. Chúng không còn là gate chặn scaffold và không yêu cầu tái tạo module/schema khi Medusa đã có năng lực tương đương.

## Phạm vi hiện tại

Đã scaffold foundation và COD. VietQR, VNPay, carrier provider Việt Nam, RBAC chi tiết, audit log ứng dụng và repair service là các extension độc lập cần triển khai ở milestone tiếp theo; không sửa trực tiếp Medusa core.
