# Security audit — 2026-08-05

## Kết quả

Lệnh đã chạy:

```powershell
corepack pnpm audit --prod
```

Kết quả hiện tại: **không đạt gate production** với 89 findings được registry tổng hợp: 1 critical, 37 high, 47 moderate và 4 low.

Các finding đáng chú ý:

| Mức | Package / đường dẫn đại diện | Bản vá được advisory nêu | Advisory |
|---|---|---|---|
| Critical | `protobufjs` qua Medusa CLI → OpenTelemetry → gRPC | `>=7.5.5` | [GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg) |
| High | `rollup` qua Medusa Framework → Vite | `>=4.59.0` | [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) |
| High | `lodash` trực tiếp trong storefront | `>=4.18.0` | [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) |
| High | `path-to-regexp` qua Medusa CLI → Express | `>=0.1.13` | [GHSA-37ch-88jc-xwx2](https://github.com/advisories/GHSA-37ch-88jc-xwx2) |
| Moderate | React Router 6 trong Admin dependency graph | yêu cầu nhánh đã vá theo upstream | [GHSA-jjmj-jmhj-qwj2](https://github.com/advisories/GHSA-jjmj-jmhj-qwj2) |
| Moderate | `postcss` qua Next/Vite/Admin bundler | `>=8.5.23` | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) |

Một số đường dẫn là CLI/build tooling, nhưng `pnpm audit --prod` vẫn coi chúng là production dependencies của starter. Cần đánh giá reachability riêng; không được tự hạ mức finding chỉ vì nó nằm sâu trong dependency graph.

## Quyết định

Không dùng `--force`, không nâng major React Router/Medusa ngoài compatibility matrix và không thêm override transitive hàng loạt ở milestone scaffold. Làm vậy có thể phá Admin hoặc runtime mà không có bằng chứng tương thích. Repository giữ nguyên version Medusa DTC starter đã pin và ghi audit failure thành blocker rõ ràng.

Trước production phải:

1. Kiểm tra bản Medusa DTC/Medusa v2 chính thức mới nhất và changelog bảo mật.
2. Nâng package/lockfile theo bản upstream tương thích; chỉ dùng override có test và ghi ADR/security exception.
3. Chạy lại lint, unit, Store API smoke test, backend/Admin build và storefront build.
4. Gate yêu cầu không còn critical/high có thể khai thác, hoặc có exception được phê duyệt với owner, reachability, biện pháp giảm thiểu và ngày hết hạn.

## Secret hygiene

Secret scan cục bộ trên source (loại `node_modules`, build output và các file runtime bị ignore) không tìm thấy credential thật. `.env`, `apps/backend/.env`, `apps/storefront/.env.local` và `.local/admin-credentials.txt` đều được Git ignore. Các chuỗi trong `setup-local.ps1` chỉ là biến được sinh bằng CSPRNG lúc chạy.
