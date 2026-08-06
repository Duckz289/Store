# Phát triển local

## Yêu cầu

- Node.js 20 trở lên (starter đang được kiểm tra với Node.js 24).
- Corepack và pnpm 10.11.1 được khóa trong `package.json`.
- Docker Desktop với Docker Compose v2.
- PostgreSQL chạy qua service `postgres` trong `docker-compose.yml` (host port 5433 để tránh xung đột PostgreSQL cài sẵn trên cổng 5432).

Redis chưa được bật vì cấu hình hiện tại chưa đăng ký Redis module. Chỉ thêm Redis khi cache/event/workflow runtime thực sự sử dụng nó.

## Thiết lập tự động trên Windows

```powershell
corepack enable
./scripts/setup-local.ps1
./scripts/start-local.ps1
```

Script thiết lập:

1. Sinh password PostgreSQL, JWT secret, cookie secret và MFA encryption key bằng CSPRNG.
2. Ghi chúng vào `.env`, `apps/backend/.env`; các file này bị Git bỏ qua.
3. Khởi động PostgreSQL 16, chạy Medusa migration, commerce seed và reconcile sáu role RBAC.
4. Đồng bộ publishable key vào `apps/storefront/.env.local`.
5. Tạo admin local, gán Owner cho đúng email được truyền vào script; credential nằm ở `.local/admin-credentials.txt` và không được commit.

Admin: `http://localhost:9000/app`. Storefront: `http://localhost:8010`. Dự án dùng 8010 vì cổng 8000 của máy đang phục vụ một ứng dụng Uvicorn khác.

## Thiết lập thủ công

```powershell
Copy-Item .env.example .env
Copy-Item apps/backend/.env.template apps/backend/.env
Copy-Item apps/storefront/.env.template apps/storefront/.env.local
```

Thay toàn bộ placeholder secret, rồi chạy:

```powershell
docker compose --env-file .env up -d postgres
corepack pnpm install --frozen-lockfile
Push-Location apps/backend
./node_modules/.bin/medusa.cmd db:migrate
Pop-Location
corepack pnpm backend:seed
corepack pnpm --filter @dtc/backend run security:seed
Push-Location apps/backend
./node_modules/.bin/medusa.cmd user -e you@example.com -p <strong-password>
Pop-Location
$env:SECURITY_OWNER_EMAIL = "you@example.com"
corepack pnpm --filter @dtc/backend run security:bootstrap-owner
Remove-Item Env:\SECURITY_OWNER_EMAIL
corepack pnpm dev
```

Seed in ra `STOREFRONT_PUBLISHABLE_KEY=...`; sao chép giá trị vào `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` nếu thiết lập thủ công.

## Dừng dịch vụ và kiểm tra

```powershell
docker compose stop
corepack pnpm lint
corepack pnpm test
corepack pnpm run test:smoke
corepack pnpm build
```

Không dùng `docker compose down -v` nếu chưa chủ đích xóa database local.
