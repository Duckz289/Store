# Security audit — 2026-08-06

## Kết luận

Security triage bắt đầu từ commit `b6ee11d` và **không** dùng `pnpm audit fix --force`, không sửa core Medusa, không nâng major ngoài constraint upstream.

| Snapshot | Critical | High | Moderate | Low | Tổng finding production |
|---|---:|---:|---:|---:|---:|
| Baseline | 1 | 37 | 47 | 4 | 89 |
| Sau hai nhóm vá tương thích | 0 | 6 | 11 | 0 | 17 |
| Thay đổi | -1 | -31 | -36 | -4 | -72 |

Critical đã được xử lý. Repository vẫn **chưa đạt gate “không còn high”**: 6 high còn lại được ghi thành risk acceptance tạm thời vì bản vá yêu cầu vượt constraint chính thức của Medusa 2.18 hoặc Next 15.5.21. Không advisory nào bị hạ severity; “rủi ro thực tế” bên dưới là đánh giá reachability riêng.

## Bằng chứng và cách phân loại

Các lệnh nguồn:

```powershell
corepack pnpm audit --prod --json
corepack pnpm audit --json
node ./scripts/security/export-pnpm-audit.mjs --label=baseline-2026-08-06
node ./scripts/security/export-pnpm-audit.mjs --label=after-compatible-patches-2026-08-06
```

Baseline `--prod` có 84 advisory duy nhất nhưng 89 vulnerability instances/path: 1 critical, 37 high, 47 moderate, 4 low. Toàn graph có 110 advisory duy nhất và 119 path; 27 path chỉ xuất hiện ở graph có development dependencies.

Trong đúng 89 finding production:

- 7 finding thuộc dependency khai báo trực tiếp; 82 là transitive.
- Cả 89 đều được pnpm xếp vào production dependency graph; không finding nào là development-only theo graph.
- “Build/CLI only” là phân loại reachability, không biến dependency thành `devDependency` và không loại finding khỏi audit.
- Mỗi dòng đã có `dependencyScope`, `dependencyType`, chain, bề mặt, reachability, mức rủi ro thực tế và URL advisory. Không còn dòng `undetermined`.

Artifacts đầy đủ:

- [`security/pnpm-audit-baseline-2026-08-06.json`](security/pnpm-audit-baseline-2026-08-06.json): đủ 89 finding và 27 path development-only bổ sung.
- [`security/pnpm-audit-baseline-2026-08-06.csv`](security/pnpm-audit-baseline-2026-08-06.csv): bảng 89 dòng để lọc/sort.
- [`security/pnpm-audit-after-compatible-patches-2026-08-06.json`](security/pnpm-audit-after-compatible-patches-2026-08-06.json): snapshot sau vá.
- [`security/pnpm-audit-after-compatible-patches-2026-08-06.csv`](security/pnpm-audit-after-compatible-patches-2026-08-06.csv): 17 dòng còn lại.

## Dependency tree critical/high ở baseline

| Package / advisory | Hiện tại → bản vá | Dependency chain đại diện | Bề mặt và rủi ro thực tế | Phương án / breaking risk | Trạng thái |
|---|---|---|---|---|---|
| `protobufjs`; [GHSA-xq3m-2v4x-88gg](https://github.com/advisories/GHSA-xq3m-2v4x-88gg), `GHSA-66ff-xgx4-vchm`, `GHSA-75px-5xx7-5xc7`, `GHSA-jvwf-75h9-cwgg`, `GHSA-685m-2w69-288q`, `GHSA-wcpc-wj8m-hjx6` | `7.5.4` → tối thiểu `7.6.1`; chọn `7.6.5` | backend → CLI → deps → OpenTelemetry → gRPC → proto-loader → protobufjs | CLI/telemetry, không có endpoint protobuf; reachability thấp nhưng critical phải vá | `@grpc/proto-loader@0.7.15` cho phép `^7.2.5`; patch/minor trong range, breaking thấp | Đã xử lý 1 critical + 5 high |
| `axios`; 11 GHSA: `35jp`, `3g43`, `43fc`, `6chq`, `777c`, `hfxv`, `j5f8`, `p92q`, `pf86`, `pmwg`, `q8qp` | `1.13.2` → các floor `1.13.5–1.16.0`; chọn `1.19.0` | backend → CLI → telemetry → axios | CLI telemetry, không nằm trong Store API; rủi ro thấp | Telemetry 2.18.0 cho phép `^1.13.1`; cùng major/range, breaking thấp | Đã xử lý 11 high |
| `form-data`; `GHSA-hmw2-7cc7-3qxx` | `4.0.5` → `4.0.6` | backend → CLI → telemetry → axios → form-data | CLI telemetry multipart; rủi ro thấp | Patch cùng major và nằm trong constraint axios; breaking thấp | Đã xử lý 1 high |
| `brace-expansion`; `GHSA-3jxr-9vmj-r5cp`, `GHSA-mh99-v99m-4gvg`, `GHSA-rgw5-rvv9-x895` | `1.1.12/5.0.5` → `1.1.18/5.0.9` | backend → Medusa/CLI → glob → minimatch → brace-expansion | Build/CLI glob; không nhận pattern từ API; rủi ro thấp | Giữ riêng từng major, nằm trong range của minimatch; breaking thấp | Đã xử lý 6 high |
| `path-to-regexp`; [GHSA-37ch-88jc-xwx2](https://github.com/advisories/GHSA-37ch-88jc-xwx2) | `0.1.12` → `0.1.13` | backend → CLI → Express → path-to-regexp | Compile route lúc startup; attacker không tạo route pattern; rủi ro thấp | Express 4.22.1 cho phép `~0.1.12`; patch, breaking thấp | Đã xử lý 1 high |
| `picomatch`; `GHSA-c2c7-rcm5-vvqj` | `2.3.1/4.0.3` → `2.3.2/4.0.5` | caching → awilix → fast-glob → micromatch; Admin bundler → tinyglobby | Startup/build glob; không nhận glob từ API; rủi ro thấp | Giữ đúng từng major/range; breaking thấp | Đã xử lý 2 high |
| `rollup`; [GHSA-mw96-cpmx-2vgc](https://github.com/advisories/GHSA-mw96-cpmx-2vgc) | `4.53.3` → `4.62.4` | backend → framework → Vite 5 → Rollup | Admin build; không chạy trong Store API; rủi ro thấp | Vite 5.4.21 cho phép `^4.20.0`; cùng major, breaking thấp | Đã xử lý 1 high |
| `postcss` qua Vite; `GHSA-6g55-p6wh-862q`, `GHSA-r28c-9q8g-f849` | `8.5.6` → `8.5.25` | backend → framework → Vite → PostCSS | Admin build; rủi ro thấp | Vite 5 cho phép `^8.4.43`; cùng major, breaking thấp | Đã xử lý 2 high của Vite path |
| `lodash`; [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) | `4.17.21/4.17.23` → `4.18.1` | storefront → lodash; CLI → GraphQL codegen → plugin-helpers → lodash | Direct storefront imports `isEqual`, `pick`, `mapKeys`; runtime-reachable nhưng không thấy primitive advisory được cấp dữ liệu nguy hiểm trực tiếp | Cùng major và nằm trong caret ranges; build/typecheck/smoke xác nhận; breaking thấp | Đã xử lý direct và transitive high |
| `immutable`; `GHSA-wf6x-7x77-mvgw`, `GHSA-v56q-mh7h-f735`, `GHSA-xvcm-6775-5m9r` | `3.7.6` → `3.8.3`; hai advisory còn lại cần `>=4.3.9` | CLI → utils → GraphQL codegen → relay optimizer → relay compiler → immutable | Code generation/build only; không nằm trong runtime request; rủi ro thấp | `@ardatan/relay-compiler@12.0.3` pin `~3.7.6`; major 4 có breaking risk cao | Xử lý 1 high; risk-accept 2 high |
| `postcss` qua Next; cùng 2 GHSA | `8.4.31` → cần `>=8.5.18` | storefront → Next 15.5.21 → PostCSS | Build CSS; không chạy trong request runtime; rủi ro thấp | Next pin exact `8.4.31`; ép override trái manifest upstream, breaking risk vừa | Risk-accept 2 high |
| `sharp`; [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | `0.34.5` → `>=0.35.0` | storefront → Next 15.5.21 → Sharp | `images.unoptimized: true`, nên image optimizer không được gọi; rủi ro hiện tại thấp | Next cho phép `^0.34.3`, không chấp nhận 0.35; breaking risk cao | Risk-accept 1 high |
| `vite`; [GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff) | `5.4.21` → `>=6.4.3` | backend → Medusa framework → Vite | Build/dev server; không chạy trong Store API; rủi ro thấp nếu dev server không public | Medusa 2.18 peer `^5.4.21`; major 6 ngoài constraint, breaking risk cao | Risk-accept 1 high |

Các GHSA viết tắt trong bảng vẫn có URL đầy đủ ở hai artifact baseline. Bảng CSV có một dòng cho từng vulnerability instance; JSON giữ cả advisory metadata và dependency chain.

## Nhóm vá tương thích đã áp dụng

Root `pnpm.overrides` chỉ target version range dễ tổn thương, không thay package bằng fork:

- `protobufjs@7.x <7.6.5` → `7.6.5`.
- `axios@1.x <1.18.0` → `1.19.0`; `form-data@4 <4.0.6` → `4.0.6`.
- `brace-expansion` → `1.1.18` hoặc `5.0.9` theo major.
- `path-to-regexp <0.1.13` → `0.1.13`.
- `picomatch` → `2.3.2` hoặc `4.0.5` theo major.
- PostCSS trong Vite-compatible range → `8.5.25`; Rollup 4 → `4.62.4`.
- Immutable 3 → `3.8.3`, chỉ xử lý advisory có patch trong major 3.
- Lodash 4 dễ tổn thương → `4.18.1`; direct storefront cũng pin `^4.18.1`.
- OpenTelemetry Core 2 → `2.9.0`; Babel Core 7 → `7.29.6`; Body Parser 1.20 → `1.20.6`.
- Direct storefront QS yêu cầu `^6.15.2` và resolve `6.15.3`; Express-compatible QS 6.14 → `6.14.2`. Advisory cần QS 6.15.2 vẫn mở trên Express path.

Medusa packages giữ nguyên `2.18.0` vì npm registry xác nhận đây là bản hiện hành và yêu cầu Node `>=20`. Node đang chạy là `24.14.0`. Next giữ nguyên `15.5.21`; không nâng major.

## Risk acceptance tạm thời

Repository owner đã xác nhận exception kỹ thuật này ngày **2026-08-06**, chỉ để tiếp tục development và các milestone nội bộ đến hết ngày **2026-09-06**. Quyết định này **không phải production approval** và không phải tuyên bố advisory đã được sửa. Trước production phải đóng exception hoặc có một quyết định production risk acceptance riêng.

Review lại ngay khi Medusa, Next hoặc dependency upstream phát hành bản tương thích, hoặc muộn nhất ngày **2026-09-06**, tùy điều kiện nào đến trước. Sáu high advisory hiện tại là phạm vi duy nhất được accept; high mới có runtime reachability không được tự động đưa vào exception này.

| Finding còn lại | Phạm vi ảnh hưởng | Lý do chưa vá | Giảm thiểu bắt buộc | Trigger đóng exception |
|---|---|---|---|---|
| 2 high `immutable@3.8.3` | GraphQL/Relay code generation trong CLI/build | Patch yêu cầu Immutable 4; parent pin `~3.7.6` | Chỉ build schema/source tin cậy; không chạy codegen với input do khách hàng upload; cô lập CI | Parent GraphQL/Relay hoặc Medusa nâng range và toàn gate pass |
| 2 high + 2 moderate `postcss@8.4.31` | Next CSS build | Next 15.5.21 pin exact | Không cho người dùng cung cấp CSS/PostCSS config; build trong CI cô lập; không chạy build từ PR không tin cậy với secrets | Next 15 patch đổi pin hoặc upgrade Next có migration/test đầy đủ |
| 1 high `sharp@0.34.5` | Optional Next image optimizer | Patch 0.35 ngoài `^0.34.3` | Giữ `images.unoptimized: true`; test phải thất bại nếu cấu hình bật optimizer mà exception chưa đóng | Next chấp nhận Sharp 0.35 và image smoke pass |
| 1 high + 2 moderate `vite@5.4.21` | Admin build/dev server | Patch yêu cầu Vite 6; Medusa peer chỉ cho Vite 5 | Không expose dev server; Admin production dùng static build; chỉ compile source tin cậy | Medusa hỗ trợ Vite `>=6.4.3` và Admin build/smoke pass |
| Moderate React Router 6 | Authenticated Admin browser | Patch yêu cầu React Router 7; `react-router-dom` advisory chưa nêu bản 6 đã vá | Admin không public trực tiếp; MFA/RBAC milestone; allow-list origin; CSP; không tin redirect do input | Medusa Dashboard hỗ trợ Router 7 hoặc upstream backport |
| Moderate còn lại: AJV, esbuild, QS và UUID | CLI/build/migration; HTTP query parsing và Redis event bus có điều kiện | Bản vá vượt parent range: AJV `~8.13`, Vite→esbuild `^0.21`, Express→QS `~6.14`, BullMQ→UUID `^9` | Query/reverse-proxy limits, rate limiting, Redis tắt khi chưa harden, CI input tin cậy, theo dõi upstream | Parent package nâng range hoặc advisory có backport tương thích |

## Verification sau nhóm cập nhật

| Gate | Kết quả |
|---|---|
| `corepack pnpm install --frozen-lockfile` | Pass |
| Workspace lint | Pass, không warning/error từ ESLint; cảnh báo deprecation `next lint` chỉ là migration note |
| Storefront TypeScript `tsc --noEmit` | Pass |
| Security-patch backend unit tests | Pass: 1 suite, 2 tests |
| Milestone 1 backend unit tests | Pass: 5 suites, 15 tests |
| Milestone 1 module integration | Pass: 1 suite, 2 tests |
| Milestone 1 HTTP integration | Pass: 1 suite, 5 tests; RBAC escalation, MFA TOTP/recovery, horizontal challenge, revoke, audit/order lifecycle |
| Backend + Admin production build | Pass |
| Storefront production build | Pass, 13 static pages generated |
| Store API smoke | Pass: VN/VND, 4 products, SKU, server price 690000, shipping 30000/0, COD |
| Admin authentication smoke | Pass: 233 effective permissions; Admin mutation trả `403 MFA_ENROLLMENT_REQUIRED`; token không được in/log |
| Milestone 1 production audit | Pass theo exception: 0 critical, 6 high, 11 moderate, 0 low; không có critical/high mới |

Snapshot sau milestone 1:

- [`security/pnpm-audit-milestone-1-rbac-mfa-audit-2026-08-06.json`](security/pnpm-audit-milestone-1-rbac-mfa-audit-2026-08-06.json)
- [`security/pnpm-audit-milestone-1-rbac-mfa-audit-2026-08-06.csv`](security/pnpm-audit-milestone-1-rbac-mfa-audit-2026-08-06.csv)

Milestone 1 không thay dependency hoặc lockfile. Sáu high còn lại vẫn chỉ được accept cho development/milestone nội bộ đến 2026-09-06; production vẫn bị chặn như phần risk acceptance ở trên.

Lần lint đầu trong sandbox bị `EPERM` khi Medusa CLI đọc `C:\Users\Admin\.config\medusa\config.json`; chạy lại với quyền đọc cấu hình cho kết quả pass. Đây là giới hạn sandbox, không phải lỗi source hay dependency.

## Gate vận hành

- CI phải chạy audit exporter và fail nếu critical xuất hiện lại.
- High mới hoặc high có runtime reachability không được tự động accept.
- Không xóa override cho đến khi lockfile đã được xác minh resolve bản upstream an toàn.
- Không bật Next image optimizer hoặc expose Vite dev server khi exception liên quan còn mở.
- Risk acceptance đã được repository owner xác nhận cho development/milestone nội bộ đến 2026-09-06; trạng thái production vẫn là blocker.
