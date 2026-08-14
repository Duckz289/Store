# Hưng Phát Custom Admin

Frontend quản trị độc lập, không sử dụng Medusa Admin UI extensions.

- Development: `corepack pnpm --filter @dtc/admin run dev`
- URL: `http://localhost:8020/admin`
- Medusa Admin fallback: `http://localhost:9000/app`

Ứng dụng chỉ giao tiếp với Medusa Admin API và custom backend APIs/workflows.
Không kết nối hoặc ghi trực tiếp PostgreSQL.
