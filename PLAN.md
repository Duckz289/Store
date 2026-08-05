# Kế hoạch kiến trúc LEARNING-FIRST — Website TMĐT đa ngành + dịch vụ sửa chữa (Việt Nam)

> **Cập nhật triển khai 05/08/2026:** M01–M15 là learning notes và checklist nghiệp vụ/kiểm thử, không bắt buộc tự xây commerce engine. Các quyết định triển khai Next.js + Supabase custom commerce và gate học đủ 15 module trước scaffold đã được thay thế bởi [ADR-001](docs/adr/ADR-001-adopt-medusa-v2.md). Nền tảng được chọn là Medusa v2 DTC Starter; các nguyên tắc nghiệp vụ, bất biến, bảo mật và acceptance criteria trong tài liệu này vẫn giữ hiệu lực. Xem [Architecture Reconciliation](docs/architecture-reconciliation.md).

> **Trạng thái hiện tại:** scaffold Medusa backend/Admin + Next.js storefront + PostgreSQL local đã được tạo trên branch `feat/medusa-commerce-foundation`. Các câu “PLAN ONLY”, “repository trống” và quyết định stack cũ bên dưới được giữ nguyên như decision history; khi xung đột, ADR-001 và Architecture Reconciliation có hiệu lực.

> Mục tiêu kép: (1) xây được hệ thống, (2) **hiểu sâu từng module** — nghiệp vụ, người dùng, luồng dữ liệu, bảo mật, hiệu năng, vận hành, scale. Tài liệu này là giáo trình + bản thiết kế, không phải chỉ là backlog.
>
> Chế độ: PLAN ONLY. Chưa tạo file code, chưa cài package, chưa chạy migration.

Repository `C:\Users\Admin\Documents\Store` **trống hoàn toàn** (0 file, chưa init git) — greenfield.

---

# PHẦN 0 — TRẠNG THÁI QUYẾT ĐỊNH

## 0.1. Quyết định ĐÃ CHỐT (bạn đã xác nhận qua Q&A)

| # | Quyết định | Hệ quả kiến trúc |
|---|---|---|
| C1 | Single-store, 1 chủ (không multi-branch, không marketplace) | Schema vẫn có bảng `locations` 1 dòng để mở chi nhánh sau không đập DB |
| C2 | Quy mô năm 1: < 1.000 SKU, < 30 đơn/ngày | Postgres FTS thay vì search engine riêng; jobs-table thay vì message broker |
| C3 | 1 người + AI agent xây và vận hành | Modular monolith, managed services, tối thiểu số công nghệ |
| C4 | Stack: Next.js + Supabase (Postgres/Auth/Storage), Vercel | 1 repo, 1 app, 1 database |
| C5 | Sửa chữa MVP = đặt lịch đơn giản + tra cứu; báo giá online để Phase 2 | Bảng `quotes` thiết kế sẵn nhưng không build UI ở MVP |
| C6 | Không có dữ liệu/hệ thống cũ | Không cần migration/đồng bộ POS |
| C7 | Guest checkout mặc định; tài khoản khách để Phase 1.5 | SĐT là định danh khách; bảng `customers` gom theo phone |
| C8 | **Next.js 16.x, không pin 15** (D1 — duyệt 31/07/2026) | Ghim minor + Dependabot vá patch; nâng major chỉ giữa các milestone |
| C9 | **Supabase Free cho CẢ dev và production giai đoạn đầu** (D2 sửa — 07/2026). Không nâng Pro cho đến khi user tự quyết định sau. **Cấm agent yêu cầu hoặc tự tạo gói trả phí Supabase** | Gate mở bán KHÔNG còn điều kiện "Pro đã bật" — thay bằng "backup 3 lớp tự vận hành đã chạy + đã restore thử" (xem M15 sửa đổi) |
| C10 | **Ngân sách vận hành < 1 triệu VND/tháng** (D3 sửa — 07/2026) | Vercel Pro (~500k) + Supabase Free (0đ) + domain .vn (~60k/tháng quy đổi); không có dòng chi Supabase Pro |
| C11 | **Cắt MoMo khỏi MVP → Phase 2** (D4 — 31/07/2026) | Thanh toán MVP: COD + VietQR (M2) → VNPay (M3); adapter chừa sẵn chỗ |
| C12 | **Thuê tư vấn pháp lý trước khi mở bán** (D5 — 31/07/2026) | 5 điểm ở 0.4-R5 thành checklist mang đi hỏi; chặn ngày mở bán, không chặn code |
| C13 | **Đã có Giấy phép kinh doanh** (A1 xác nhận — 31/07/2026) | M3 (VNPay) + hồ sơ Bộ Công Thương khởi động từ tuần 1 như kế hoạch |
| C14 | **Phí ship cố định 2 vùng** + freeship từ ngưỡng, chỉnh trong admin settings (A2 — 31/07/2026) | Cấu hình `settings`, không hardcode; tạo vận đơn thủ công, API GHN Phase 2 |

## 0.2. GIẢ ĐỊNH TẠM (chưa xác nhận — mỗi cái có rủi ro + phương án thay thế)

> A1 (GPKD) và A2 (phí ship) đã được xác nhận trong Decision Review 31/07/2026 → chuyển thành C13, C14 ở mục 0.1. Còn lại A3–A7:

| # | Giả định | Rủi ro | Nếu sai thì |
|---|---|---|---|
| A3 | Chính sách: 7 ngày đổi mới lỗi NSX, bảo hành theo hãng | Trung bình | Sửa nội dung trang chính sách, không đổi code |
| A4 | Hóa đơn điện tử: xuất thủ công khi khách yêu cầu, API để Phase 2 | Trung bình — **cần kế toán xác nhận** (xem 0.4-R5) | Nếu buộc HĐĐT từ máy tính tiền: thêm tích hợp M-Invoice/MISA sớm hơn |
| A5 | Chỉ tiếng Việt toàn MVP | Thấp | i18n là việc của Phase 3 |
| A6 | Địa chỉ theo mô hình hành chính 2 cấp mới (34 tỉnh/thành → phường/xã, bỏ cấp huyện từ 07/2025) | Trung bình — đơn vị vận chuyển có thể còn dùng danh mục cũ | Bảng `addresses` giữ thêm cột `district` nullable để map ngược nếu carrier yêu cầu |
| A7 | Khách sửa chữa mang máy tới cửa hàng (không nhận ship máy ở MVP) | Thấp | Thêm tùy chọn "gửi máy qua bưu điện" ở Phase 2 |

## 0.3. QUYẾT ĐỊNH ĐÃ PHÊ DUYỆT — biên bản Decision Review 31/07/2026 (D2/D3 sửa lại 07/2026)

Cả 6 mục được rà từng mục một (giải thích đơn giản trước, kỹ thuật sau), bạn chọn trực tiếp — không mục nào do AI tự quyết:

| # | Quyết định của bạn | Thực thi |
|---|---|---|
| D1 ✅ | Next.js 16.x, không pin Next 15 | → C8 |
| D2 ✅ **(đã sửa)** | **Supabase Free cho cả dev lẫn production** ở giai đoạn đầu; không nâng Pro cho đến khi bạn tự quyết sau; **agent không được đề nghị hoặc tự tạo gói trả phí** | → C9 |
| D3 ✅ **(đã sửa)** | **Ngân sách vận hành < 1 triệu VND/tháng** | → C10 |
| D4 ✅ | Cắt MoMo khỏi MVP, dời Phase 2 | → C11 |
| D5 ✅ | Thuê tư vấn pháp lý trước khi mở bán (~3–10 triệu một lần) | → C12; đặt lịch trong M1–M2 |
| D6 ✅ | A1: **đã có GPKD** · A2: **phí ship cố định 2 vùng** | → C13, C14 |

**Đổi lại của việc chọn Supabase Free cho production**: rủi ro mất dữ liệu (không backup tự động, có thể tự pause) không còn được nhà cung cấp gánh — chuyển thành trách nhiệm vận hành của bạn/agent, xử lý bằng bộ giảm thiểu ở mục 0.5 và M15 (đã viết lại). Đây là đánh đổi bạn đã biết và chấp nhận, không phải rủi ro ẩn.

Không còn quyết định nào treo ở cấp kiến trúc. Giả định còn lại (A3–A7, mục 0.2) không chặn milestone nào trước gate mở bán.

## 0.5. RÀNG BUỘC VẬN HÀNH BẮT BUỘC (bổ sung theo yêu cầu 07/2026 — áp dụng cho agent lẫn người)

- **Cấm tuyệt đối**: agent (AI) không được tự tạo, tự nâng cấp, hoặc chủ động đề nghị/nhắc nâng cấp Supabase lên gói trả phí (Pro hay bất kỳ tier nào khác) dưới bất kỳ hình thức nào (không tạo qua dashboard, không qua MCP tool `mcp__claude_ai_Supabase__*`, không gợi ý trong PR/code). Quyết định nâng cấp — nếu có — là của user, tại thời điểm user chọn, không phải điều kiện gate ngầm định của bất kỳ milestone nào.
- Ràng buộc này cần được chép nguyên văn vào `CLAUDE.md` ở M0b để agent thực thi code cũng tuân thủ, không chỉ agent lập kế hoạch.

### 0.5.1. Risk register — Supabase Free chạy production (bổ sung theo yêu cầu 07/2026)

| Rủi ro cụ thể | Xác suất/Tần suất | Tác động nếu xảy ra | Mức (sau giảm thiểu) |
|---|---|---|---|
| **Auto-pause sau 7 ngày không có request** | Thấp với site có traffic thật hằng ngày; **cao trong giai đoạn dev/staging ít dùng** | Site "sập" tới khi ai đó vào Supabase dashboard bấm resume — có độ trễ vài phút tới vài giờ nếu không ai để ý | TB → Thấp (giảm bằng uptime ping giữ warm) |
| **Không có backup tự động / không PITR** | Chắc chắn đúng (đặc tính tier, không phải xác suất) | Mất dữ liệu vĩnh viễn nếu có sự cố giữa 2 lần backup thủ công | Cao → TB (giảm bằng pg_dump tần suất cao, xem dưới) |
| **Giới hạn 500MB DB / 1GB storage / 5GB egress** | Trung bình theo thời gian (catalog + đơn tăng dần) | Ghi bị chặn đột ngột khi chạm trần — mất đơn hàng thật giữa giờ bán | TB (giảm bằng alert usage 80% + kế hoạch dọn dữ liệu/nén ảnh) |
| **Không SLA, không hỗ trợ ưu tiên** | — | Sự cố tự xử lý hoàn toàn, không có ai để gọi | Chấp nhận (đặc thù đã biết trước, đúng bản chất "1 người vận hành") |
| **2 project giới hạn (free)** | Thấp | Không đủ project cho dev + staging + prod tách biệt nếu cần mở rộng | Thấp — MVP chỉ cần 1 prod (+ có thể 1 dev cục bộ qua Supabase CLI, không tính vào quota cloud) |

### 0.5.2. Phương án giảm thiểu bắt buộc (thay thế cho việc mua Supabase Pro)

Mỗi dòng dưới đây là một nghĩa vụ vận hành cụ thể — không tùy chọn — vì đây là cái "mua" thay cho tiền Pro:

1. **Backup database định kỳ ra nơi độc lập**: GitHub Actions cron chạy `pg_dump` (Supabase connection string) → nén → đẩy lên object storage **không phải Supabase** (Cloudflare R2 free tier 10GB hoặc Backblaze B2 free 10GB). Tần suất **4–6 giờ/lần** (cao hơn mức 6h/lần đã tính khi còn định dùng Pro daily-backup làm lớp 1 — giờ đây pg_dump là lớp DUY NHẤT nên phải dày hơn). Giữ 14–30 bản gần nhất theo lịch xoay vòng (xóa bản cũ để không vượt free tier storage).
2. **Backup ảnh (Supabase Storage)**: `pg_dump` KHÔNG chứa file storage — cần job riêng: `rclone sync` bucket Supabase Storage → R2/B2 hằng tuần (hoặc hằng ngày nếu ảnh đổi nhiều trong giai đoạn nhập catalog M1).
3. **Monitoring/alert riêng cho rủi ro đặc thù Free tier**:
   - Uptime ping `/api/health` mỗi 1 phút (BetterStack free) — vừa phát hiện site chết, vừa giữ project không bị tính "không có request" (giảm khả năng bị auto-pause, dù ping health-check nội bộ không chắc tính là traffic hợp lệ — cần xác minh thực nghiệm ở M0b, ghi vào RUNBOOK).
   - Cron riêng (chạy trong pg_dump job) kiểm tra kết nối DB thất bại 3 lần liên tiếp → gửi email/SMS ngay (dấu hiệu project bị pause hoặc chết).
   - Alert usage 80% của giới hạn DB size / storage / egress (Supabase dashboard có cảnh báo cơ bản; bổ sung script tự kiểm qua Supabase Management API nếu cần chi tiết hơn).
4. **Quy trình restore thử (bắt buộc, không phải "nên làm")**: diễn tập restore **mỗi tháng** (dày hơn mức "mỗi quý" đã định khi có Pro, vì giờ backup là lớp phòng thủ duy nhất — phải chắc nó thực sự dùng được): dựng project Supabase Free tạm/instance Postgres local → restore bản pg_dump mới nhất → chạy smoke test đọc dữ liệu → ghi biên bản (thời gian restore thực tế = RTO thật) vào RUNBOOK. Nếu restore thất bại — đây là tín hiệu dừng ngay và sửa quy trình backup, không đợi đến khi cần thật.
5. **Nguyên tắc chấp nhận rủi ro còn lại**: RPO thực tế ở mức **4–6 giờ** (thay vì gần 0 nếu có Pro PITR) — nghĩa là một sự cố xấu nhất có thể mất tối đa các đơn hàng phát sinh trong khung đó. Ở quy mô < 30 đơn/ngày, tối đa ~7–8 đơn có thể phải nhập tay lại từ email xác nhận/lịch sử app ngân hàng nếu rơi đúng tình huống xấu nhất — mức rủi ro này là điều bạn đã chấp nhận khi chọn giữ Free.

Điểm quyết định lại trong tương lai (không phải gate bắt buộc, chỉ là mốc để bạn tự cân nhắc — agent không được chủ động nhắc): khi DB tiệm cận 500MB, hoặc số đơn/ngày tăng đáng kể khiến RPO 4–6h trở nên rủi ro hơn về mặt tiền bạc, hoặc bạn tự thấy quy trình thủ công quá tải.

## 0.4. RE-CHECK 5 ĐIỂM BẠN YÊU CẦU — kết luận + căn cứ

> Cập nhật 31/07/2026: toàn bộ kết luận dưới đây đã được chốt qua Decision Review — kết quả ở 0.1 (C8–C14) và 0.3. Giữ nguyên phần này làm căn cứ tra cứu.

| # | Nghi vấn | Kết luận sau kiểm chứng |
|---|---|---|
| R1 | Next.js 15 có nên pin? | **Không.** Stable hiện tại là 16.2.x (Active LTS tới ~10/2027); Next 15 hết hỗ trợ bảo mật 21/10/2026. Chính sách: pin minor trong `package.json` + lockfile, vá patch hằng tuần qua Dependabot, chỉ nâng major giữa các milestone. Xác minh lại phiên bản chính xác bằng `npm view next version` tại M0 |
| R2 | Ngân sách < 1M/tháng có thực tế? | **Ban đầu kết luận là không** (cấu hình an toàn tối thiểu với Supabase Pro ≈ 1,25M/tháng). **Đã sửa theo quyết định của bạn (07/2026): giữ Supabase Free cả production → ngân sách < 1 triệu/tháng khả thi** (chủ yếu là Vercel Pro ~500k + domain quy đổi ~60k). Đánh đổi: rủi ro dữ liệu ở R3 không còn được mua bằng tiền (Pro) mà phải bù bằng quy trình vận hành (mục 0.5, M15). Vẫn còn chi phí ngoài hạ tầng không đổi: phí giao dịch VNPay (~1,0–2,2%/giao dịch), tên miền .vn năm đầu ~750k, phí tư vấn pháp lý một lần (D5) |
| R3 | Supabase Free có phù hợp production? | **Về mặt kỹ thuật/rủi ro thuần túy: không lý tưởng** — căn cứ đã kiểm chứng: không backup tự động, tự pause sau 7 ngày không request, không SLA/hỗ trợ, 500MB DB/1GB storage. **Bạn đã quyết định chấp nhận rủi ro này (07/2026) để giữ ngân sách < 1 triệu/tháng**, với điều kiện: risk register cập nhật rõ ràng (mục 0.5.1) và bộ giảm thiểu vận hành bắt buộc (pg_dump tần suất cao ra nơi độc lập, backup ảnh storage, monitoring/alert pause, restore drill định kỳ — chi tiết ở M15 đã viết lại). Đây không còn là khuyến nghị "nên nâng Pro" mà là phương án đã chốt — agent không được nhắc lại đề nghị nâng cấp (xem 0.5) |
| R4 | Phạm vi thanh toán có quá lớn cho MVP? | **Có.** 4 provider cho 1 dev solo là quá rộng. Đề xuất D4: COD + VietQR (M2) → VNPay (M3) → MoMo (Phase 2, theo nhu cầu thật). Kiến trúc adapter khiến việc thêm MoMo sau chỉ là 1 file provider + config, không đụng core |
| R5 | Giả định pháp lý có cần xác minh chuyên nghiệp? | **Có — bắt buộc.** 5 điểm cần luật sư/kế toán xác nhận, tôi chỉ nêu định hướng: (1) Thông báo website TMĐT bán hàng với Bộ Công Thương (NĐ 52/2013 + 85/2021) — thủ tục, thời điểm, mức phạt; (2) Bảo vệ dữ liệu cá nhân: NĐ 13/2023 **và Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 (hiệu lực 01/01/2026)** — nghĩa vụ hồ sơ đánh giá tác động, và đặc biệt: dữ liệu khách lưu trên Supabase đặt tại Singapore = **chuyển dữ liệu ra nước ngoài**, cần đánh giá theo luật mới; (3) Hóa đơn điện tử: NĐ 123/2020 + NĐ 70/2025 — hộ/cá nhân KD bán lẻ doanh thu từ ~1 tỷ/năm phải dùng HĐĐT khởi tạo từ máy tính tiền — kế toán phải chốt bạn thuộc diện nào; (4) Luật Bảo vệ quyền lợi người tiêu dùng 2023 (hiệu lực 07/2024) — nghĩa vụ với "hợp đồng giao kết từ xa", chính sách đổi trả; (5) Điều kiện merchant VNPay/MoMo (GPKD, website đã thông báo BCT). Trạng thái từng điểm ghi ở module 2.14 |

---

# PHẦN 1 — BỨC TRANH TỔNG THỂ

## 1.1. Đồ thị phụ thuộc module

```
                ┌─────────────────────────────────────────────┐
                │ M01 App core: request lifecycle, module hóa │
                └───────┬─────────────────────────┬───────────┘
                        ▼                         ▼
               M02 Identity/MFA/RBAC      M11 Jobs & Notifications
                        │                         ▲    ▲
                        ▼                         │    │
               M10 Admin + Audit log ─────────────┘    │
                        │                              │
        ┌───────────────┼──────────────────┐           │
        ▼               ▼                  ▼           │
   M03 Catalog ◄── M13 Media          M09 Repairs ─────┘
        │  │
        │  └────────► M12 Search & SEO
        ▼
   M04 Inventory        M05 Pricing/Promo/Coupon
        │                       │
        └───────────┬───────────┘
                    ▼
          M06 Cart & Checkout
                    ▼
          M07 Orders & Fulfillment ──► M08 Payments (COD/VietQR/VNPay[/MoMo])
                                              │
                                              ▼
                                       M11 (email, cron đối soát)

   M14 Privacy & Compliance ── cắt ngang mọi module (consent, retention, BCT)
   M15 Perf/Monitoring/Backup/DR ── cắt ngang mọi module (SLO, alert, restore)
```

Quy tắc đọc: mũi tên A → B nghĩa là B cần A hoạt động trước. Hai module cắt ngang (M14, M15) có yêu cầu chèn vào acceptance criteria của mọi milestone chứ không đứng riêng cuối cùng.

## 1.2. Thứ tự implement khuyến nghị + lý do

| Bước | Module | Lý do đứng ở vị trí này |
|---|---|---|
| 0 | **M0a Architecture Learning Pack** (docs/modules/M01–M15.md) | Học trước khi xây: mỗi module một tài liệu học bạn duyệt từng file — không có dòng code nào trước khi toàn bộ được duyệt (gate cứng, xem Phần 6) |
| 1 | M01 App core | Mọi thứ khác đứng trên nó; sai ở đây thì sửa đắt nhất |
| 2 | M02 Identity | Admin phải tồn tại trước khi có gì để quản trị; RLS cần định nghĩa role từ đầu |
| 3 | M10 Audit (phần lõi) | Bật audit TRƯỚC khi có dữ liệu thật — gắn audit vào sau là điểm mù lịch sử |
| 4 | M03 Catalog | Trái tim của cửa hàng; mọi module tiền/kho tham chiếu variant |
| 5 | M13 Media | Catalog không dùng được nếu không upload được ảnh an toàn |
| 6 | M12 Search (FTS cơ bản) | Rẻ khi làm cùng lúc với catalog (cùng migration, cùng cột) |
| 7 | M04 Inventory | Phải chốt ledger + atomic update TRƯỚC khi checkout tồn tại |
| 8 | M05 Pricing (giá + sale, coupon để bước 12) | Checkout cần hàm resolvePrice; coupon phức tạp hơn, tách sau |
| 9 | M06 Cart & Checkout | Con đường doanh thu — mọi thứ trước đó phục vụ bước này |
| 10 | M07 Orders | Sinh ra từ checkout; state machine phải có trước thanh toán online |
| 11 | M08a Payments: COD + VietQR | Mở bán được sớm nhất, không phụ thuộc duyệt merchant |
| 12 | M11 Jobs/Notifications | Email xác nhận + cron release kho — đơn thật cần ngay |
| 13 | M09 Repairs | Độc lập chuỗi bán hàng, làm song song chờ duyệt merchant |
| 14 | M08b VNPay | Phụ thuộc bên ngoài (merchant) — xếp chỗ có thể trượt mà không chặn |
| 15 | M05b Coupon + M12b SEO hoàn thiện | Tăng trưởng sau khi lõi chạy |
| 16 | M14 + M15 hardening | Rà toàn bộ checklist trước khi đẩy traffic |

## 1.3. Trình tự "HỌC TRƯỚC KHI CODE" (study sequence)

Mỗi mục: học gì → để hiểu module nào → nguồn chuẩn (đọc docs chính thức, không đọc blog trước).

1. **HTTP, cookie, session, CORS, same-origin** → nền của mọi thứ → MDN HTTP guide.
2. **React Server Components vs Client Components, App Router, ISR/revalidateTag** → M01, M12 → docs Next.js (mục Rendering, Caching, Server Actions).
3. **Postgres căn bản: transaction, isolation level, row lock, constraint, index (B-tree vs GIN)** → M03–M08 → docs PostgreSQL chương Concurrency Control + Indexes. Đây là mục quan trọng nhất toàn dự án.
4. **Row Level Security của Postgres/Supabase + phân biệt anon key vs service-role key** → M02 → docs Supabase Auth & RLS.
5. **State machine cho nghiệp vụ** (tại sao UPDATE status tự do là bug factory) → M07, M08, M09 → đọc mục 2.7/2.8 tài liệu này + bài "orders as state machines" bất kỳ của Stripe docs.
6. **Ledger/sổ cái append-only** (tại sao kho không chỉ là 1 con số) → M04 → mục 2.4.
7. **HMAC, chữ ký webhook, idempotency, replay attack** → M08 → docs VNPay sandbox + đọc mục Webhooks của Stripe docs (khái niệm chuẩn ngành, áp dụng y hệt).
8. **OWASP Top 10 (2021) + upload file an toàn** → M13, toàn bộ threat model → owasp.org.
9. **Full-text search Postgres: tsvector, unaccent, pg_trgm** → M12 → docs Postgres chương Text Search.
10. **SPF/DKIM/DMARC, deliverability email** → M11 → docs Resend.
11. **RTO/RPO, backup vs replica, diễn tập restore** → M15 → mục 2.15.
12. **Nghĩa vụ pháp lý TMĐT VN** (đọc để biết hỏi luật sư câu gì) → M14 → online.gov.vn + văn bản ở 0.4-R5.

---

# PHẦN 2 — ĐẶC TẢ HỌC TẬP TỪNG MODULE

> Quy ước chung cho mọi module: tiền = `bigint` VND; thời gian = `timestamptz` UTC hiển thị Asia/Ho_Chi_Minh; mọi bảng có `id uuid`, `created_at`, `updated_at`; RLS bật default-deny; mọi mutation đi qua Server Action/Route Handler phía server.
>
> Cấu trúc thư mục đích (tham chiếu bởi mục "Code sẽ nằm ở" của từng module):
> ```
> src/
>   app/(storefront)/…            # trang công khai (RSC)
>   app/admin/…                   # trang quản trị
>   app/api/webhooks/{provider}/route.ts
>   app/api/cron/{job}/route.ts
>   modules/{auth,catalog,inventory,pricing,cart,orders,payments,repairs,
>            customers,notifications,search,media,audit}/
>     service.ts        # nghiệp vụ, transaction — nơi duy nhất ghi DB của module
>     queries.ts        # đọc dữ liệu cho RSC
>     actions.ts        # Server Actions (validate → gọi service)
>     schemas.ts        # Zod schemas
>   db/schema/*.ts  db/migrations/*.sql
>   lib/{supabase,rate-limit,email,logger,money,slug,turnstile}.ts
> ```

---

## 2.1. M01 — Kiến trúc ứng dụng & vòng đời request

**Mục đích & vai trò**: Bộ xương để 14 module còn lại đứng vững: định nghĩa request đi qua đâu, ai được gọi gì, transaction bắt đầu/kết thúc ở đâu. Vai trò: mọi user gián tiếp; trực tiếp là bạn (dev).

**Use case chính**: (1) khách mở trang SP → trả HTML từ cache ISR trong < 100ms; (2) khách submit checkout → Server Action chạy transaction; (3) VNPay gọi IPN → Route Handler verify chữ ký; (4) Vercel Cron gọi mỗi phút → xử lý jobs.

**Ranh giới & phụ thuộc**: Không chứa nghiệp vụ. Sở hữu: middleware, layout gốc, khung module, client Supabase (anon/service), error boundary, health check. Phụ thuộc: không (là gốc).

**5 loại request — vòng đời từng loại** (đây là bài học lõi của module):

| Loại | Đường đi | Cache | Ghi DB? |
|---|---|---|---|
| Trang công khai (RSC) | CDN Vercel → (miss) → RSC render → `queries.ts` → Postgres | ISR revalidate 60s + `revalidateTag` khi admin sửa | Không bao giờ |
| Server Action (form) | POST → middleware (rate limit) → `actions.ts` (Zod) → `service.ts` (transaction) | Không cache | Có — 1 transaction/1 thao tác nghiệp vụ |
| Route Handler API | như trên, cho endpoint không phải form (tra cứu, search suggest) | tùy endpoint | Hiếm |
| Webhook/IPN | POST từ cổng thanh toán → verify chữ ký → ghi `webhook_events` → xử lý | Không | Có, idempotent |
| Cron | GET từ Vercel Cron + header `CRON_SECRET` → claim jobs → chạy | Không | Có |

**Bất biến (invariants)**:
1. Client không bao giờ là nguồn sự thật về tiền/kho — server tính lại tất cả.
2. Mỗi thao tác nghiệp vụ = đúng 1 transaction DB; không có transaction vắt qua 2 request.
3. Module chỉ ghi vào bảng mình sở hữu; muốn ghi chéo phải gọi `service` của module kia (import hàm, không import bảng).
4. `SUPABASE_SERVICE_ROLE_KEY` chỉ tồn tại trong code server; xuất hiện trong client bundle = sự cố bảo mật cấp 1.
5. Mọi input từ ngoài (form, query, webhook, CSV) qua Zod trước khi chạm nghiệp vụ.

**AuthN/AuthZ**: middleware phân 3 vùng: công khai (RSC, không auth) / `/admin/*` (session + `admin_users.is_active` + AAL2) / `/api/cron|webhooks` (secret/chữ ký, không session).

**Threat & abuse**: lộ service key (kiểm bằng CI: grep bundle output); SSRF từ server code gọi URL user cung cấp (quy tắc: không bao giờ fetch URL do user nhập); cache poisoning (không render nội dung phụ thuộc user vào trang ISR); CSRF (Server Actions của Next đã ràng POST + kiểm origin — vẫn thêm Turnstile cho form công khai vì CSRF ≠ bot).

**Validation & lỗi**: lỗi nghiệp vụ trả về dạng `{ ok: false, code: 'OUT_OF_STOCK', message }` — không throw xuyên lên UI; lỗi hệ thống → error boundary + Sentry + mã tra cứu hiển thị cho user.

**Hiệu năng & cache**: RSC-first; JS client ban đầu < 170KB gzip; tag cache: `product:{id}`, `category:{id}`, `settings` — admin sửa gì revalidate đúng tag đó.

**Observability & phục hồi**: `/api/health` (kiểm DB + storage); Sentry cả server/client; deploy hỏng → Vercel instant rollback (< 1 phút, không mất dữ liệu vì DB không rollback theo code — đây là lý do migration phải backward-compatible: **expand → migrate → contract**, không bao giờ DROP cột trong cùng release dùng nó).

**Scale trigger**: p95 render > 500ms hoặc DB CPU > 60% kéo dài → xem lại query trước khi thêm hạ tầng.

**Code**: `src/app/layout.tsx`, `src/middleware.ts`, `src/lib/*`, khung `src/modules/*`.

**Câu hỏi phải trả lời được trước khi code**: RSC khác Client Component chỗ nào và tại sao PDP gần như không cần JS? `revalidateTag` hoạt động ra sao? Tại sao transaction không được vắt qua 2 request? Expand→migrate→contract là gì?

---

## 2.2. M02 — Identity, Authentication, MFA, RBAC

**Mục đích & vai trò**: Bảo vệ tài sản quý nhất (quyền admin) và định danh khách hàng. Vai trò: `owner` (bạn — mọi quyền), `staff` (thuê sau — quyền hạn chế), `customer` (Phase 1.5), `anonymous` (khách vãng lai).

**Use case**: owner đăng nhập email+password → nhập TOTP → vào admin; owner mời staff; vô hiệu hóa staff nghỉ việc → mọi session của họ chết ngay request sau; đổi/khôi phục mật khẩu; (Phase 1.5) khách đăng ký.

**Ranh giới & phụ thuộc**: Sở hữu `admin_users`; ủy quyền lưu trữ credential/session cho Supabase Auth (bảng `auth.users` do Supabase quản — không tự viết bảng password). Phụ thuộc: M01. Được dùng bởi: mọi module có admin.

**Dữ liệu**:
```
admin_users (id, auth_user_id UQ → auth.users, role: owner|staff, is_active bool,
             invited_by, last_login_at)
-- Index: UQ(auth_user_id). Ràng buộc nghiệp vụ (app-level): luôn tồn tại ≥1 owner active.
```

**Điểm cần chốt trước M0b — lời mời staff**: người được mời có thể chưa có `auth.users`/`auth_user_id` trước khi chấp nhận email. Khuyến nghị tách bảng `admin_invites` (email, token_hash, invited_by, role, expires_at, accepted_at), sau khi chấp nhận mới tạo `admin_users`; phương án thay thế là `auth_user_id` nullable ở trạng thái pending với unique index phù hợp. Không lưu invite token plaintext.

**Ma trận quyền (RBAC) — nguồn sự thật, mọi Server Action admin phải check**:

| Hành động | owner | staff |
|---|---|---|
| CRUD sản phẩm, kho, đơn, phiếu sửa chữa | ✅ | ✅ |
| Xem giá vốn (`cost_price`) | ✅ | ❌ |
| Sửa giá hàng loạt / tạo khuyến mãi | ✅ | ❌ |
| Refund, hủy đơn đã giao | ✅ | ❌ |
| Quản lý admin users, settings, xem audit log | ✅ | ❌ |
| Xuất dữ liệu khách hàng | ✅ | ❌ |

**Luồng auth (state)**: `anonymous → password_verified (AAL1) → totp_verified (AAL2) → active session`. Bất biến: **route `/admin/*` yêu cầu AAL2** — password đúng nhưng chưa TOTP thì vẫn đứng ngoài; check `is_active` mỗi request (không cache theo session).

**API/Actions**: dùng UI + SDK Supabase Auth (`signInWithPassword`, `mfa.challenge/verify`, reset password qua email); tự viết: action `inviteStaff`, `deactivateAdmin`, và `requireRole(role)` helper mà mọi action admin gọi đầu tiên.

**Luồng dữ liệu**: Login form (client) → Supabase Auth (HTTPS trực tiếp) → cookie session httpOnly (do `@supabase/ssr` quản) → middleware đọc cookie → xác thực JWT → tra `admin_users` → gắn `actor` vào context request → service ghi `actor_id` vào audit.

**Threat & abuse**:

| Tấn công | Chống |
|---|---|
| Credential stuffing / brute force | Rate limit 5 lần/15' theo IP+email, lockout; TOTP bắt buộc nên password lộ chưa đủ vào |
| Trộm cookie session | httpOnly + Secure + SameSite=Lax; không bao giờ đưa token vào URL/localStorage |
| Leo thang đặc quyền (staff sửa payload gọi action của owner) | Check role ở server trong TỪNG action, không tin UI ẩn nút |
| Session còn sống sau khi bị vô hiệu | `is_active` check mỗi request; nút "thu hồi mọi phiên" gọi Supabase sign-out toàn cục |
| Phishing lấy TOTP | Không chống tuyệt đối được bằng TOTP — ghi log IP lạ + cảnh báo email khi đăng nhập từ IP mới |

**Validation & lỗi**: thông báo đăng nhập sai luôn chung chung ("email hoặc mật khẩu không đúng") — không tiết lộ email tồn tại hay không; reset password cũng vậy.

**Hiệu năng**: xác thực JWT là verify chữ ký cục bộ (không gọi mạng mỗi request); tra `admin_users` cache trong request scope.

**Observability**: log mọi login thành công/thất bại (IP, UA) 90 ngày; alert khi > 20 lần thất bại/giờ.

**Tests**: unit `requireRole`; integration: anon key SELECT `admin_users` phải bị RLS chặn (test tự động bắt buộc); e2e: login + TOTP + bị đá khi deactivate; security: truy cập `/admin` với AAL1 → redirect.

**Phục hồi**: Supabase Auth hiện không cung cấp recovery codes cho MFA; thiết kế chính là đăng ký một TOTP factor dự phòng trên thiết bị/app khác và cất thông tin setup ở nơi an toàn. Nếu mất toàn bộ factors, dùng quy trình hỗ trợ/owner được xác minh trong RUNBOOK; không tự xây cơ chế bỏ qua MFA.

**Scale/tiến hóa**: Phase 1.5 thêm `customers` đăng nhập (email OTP hoặc Zalo/Google) — không đụng RBAC admin; nếu > 5 staff → cân nhắc permission theo bảng thay vì enum role.

**Code**: `src/modules/auth/*`, `src/middleware.ts`, `src/app/admin/(auth)/*`.

**Câu hỏi trước khi code**: JWT được verify thế nào mà không gọi Supabase? AAL1/AAL2 là gì? Tại sao RLS là lưới an toàn thứ hai chứ không phải cơ chế phân quyền chính của admin? Vì sao nên đăng ký TOTP factor dự phòng thay vì tự xây recovery-code bypass?

---

## 2.3. M03 — Catalog: danh mục, thương hiệu, sản phẩm, biến thể SKU

**Mục đích & vai trò**: Nguồn sự thật về "bán cái gì, mô tả ra sao". Đa ngành hàng (điện thoại → gia dụng → linh kiện) nên cấu trúc thuộc tính phải mềm. Vai trò: khách (đọc), owner/staff (viết).

**Use case**: admin tạo SP "iPhone 15 Pro Max" 2 option (Màu × Dung lượng) → 6 variant, mỗi variant giá + SKU riêng; đổi tên/slug SP đang chạy quảng cáo mà không chết link; import 200 SP từ CSV; khách lọc "Tủ lạnh" theo hãng + dung tích; ẩn SP hết kinh doanh nhưng đơn cũ vẫn hiển thị đúng tên.

**Ranh giới & phụ thuộc**: Sở hữu categories/brands/products/options/variants/images/slug_redirects. KHÔNG sở hữu: tồn kho (M04), giá khuyến mãi (M05), ảnh vật lý (M13). Phụ thuộc: M13 (URL ảnh), M12 (đánh index khi thay đổi).

**Dữ liệu** (ràng buộc và index là phần phải hiểu kỹ):
```
categories (id, parent_id FK↺ NULL, name, slug UQ, position, depth ≤ 3 (app-check),
            spec_template jsonb,   -- [{key:'dung_tich', label:'Dung tích', unit:'lít'}]
            filter_keys jsonb, is_active)
            CHECK (parent_id != id); chống vòng lặp sâu hơn: app-level walk-up khi đổi parent
brands     (id, name, slug UQ, logo_url)
products   (id, category_id FK, brand_id FK NULL, name, slug UQ, description_html,
            specs jsonb, status: draft|published|archived, warranty_months int,
            meta_title, meta_desc, search_text tsvector GENERATED -- xem M12
            )  Index: (category_id, status), (brand_id), GIN(search_text), trgm(name)
product_options       (id, product_id, name, position)          -- "Màu"
product_option_values (id, option_id, value, position)          -- "Titan tự nhiên"
product_variants (id, product_id, sku UQ NOT NULL, option_values jsonb,
                  combo_key text GENERATED (hash chuẩn hóa của option_values),
                  price bigint CHECK price >= 0, compare_at_price bigint NULL,
                  cost_price bigint NULL, barcode, weight_grams, is_default, is_active)
                  UQ(product_id, combo_key)   -- chặn 2 variant trùng tổ hợp
product_images (id, product_id, variant_id NULL, url, alt NOT NULL, position)
slug_redirects (old_slug UQ, entity: product|category, new_slug)
```
Quan hệ: product 1–n variants (bắt buộc ≥1, SP không option có 1 variant mặc định); ảnh gắn product, tùy chọn gắn variant (ảnh đổi theo màu).

**Bất biến**: (1) `status='published'` ⇒ có ≥1 variant `is_active` giá > 0 và ≥1 ảnh — enforce ở service khi publish, không enforce nổi bằng CHECK vì cross-table; (2) đổi slug ⇒ tự ghi `slug_redirects` trong cùng transaction; (3) không hard-delete product/variant từng có trong đơn — chỉ `archived` (order_items đã snapshot nên hiển thị đơn cũ không phụ thuộc, nhưng giữ để đối chiếu); (4) `specs` của SP phải khớp `spec_template` của category (validate mềm — cảnh báo, không chặn).

**API/Actions + edge cases**: admin actions `upsertProduct`, `publishProduct`, `archiveProduct`, `importCsv`; public đọc qua `queries.ts` trong RSC (không có REST public). Edge: publish thiếu ảnh → lỗi nghiệp vụ rõ ràng; import CSV 200 dòng có 3 dòng hỏng → import 197, trả report dòng lỗi + lý do (không all-or-nothing, có cờ `--strict` khi cần); đổi category của SP đã bán → cho phép, cảnh báo filter cũ; xóa category còn SP → chặn.

**Luồng dữ liệu**: Admin form (client component) → action Zod → service (transaction: product + options + variants + regenerate combo_key) → `revalidateTag('product:x','category:y')` → ISR trang public tự làm mới.

**AuthN/AuthZ**: viết: owner/staff (staff không thấy `cost_price` — cột bị loại ngay ở tầng query, không phải ẩn ở UI); đọc public: RLS cho anon SELECT khi `status='published'` (phòng thủ sâu — dù storefront query bằng server).

**Threat & abuse**: XSS qua `description_html` → sanitize server-side bằng allowlist (chỉ thẻ trình bày, cấm script/style/iframe/on*); SEO-spam slug (slug sinh từ tên, chuẩn hóa allowlist `[a-z0-9-]`); scraping đối thủ (chấp nhận — dữ liệu công khai; rate limit là đủ).

**Validation & lỗi**: Zod: name 1–200 ký tự, price bigint ≥ 0 (đơn vị VND, không thập phân), slug regex; lỗi import CSV trả file lỗi kèm số dòng.

**Hiệu năng & cache**: PDP là ISR + tag; listing category ISR 60s; đếm SP trong danh mục: đếm thật (< 1.000 SKU đếm thẳng rất rẻ, chưa cần denormalize).

**Observability**: audit log mọi thay đổi price/status (trigger — xem M10); metric: số SP published, số SP thiếu ảnh.

**Tests**: unit slug + combo_key; integration: UQ combo chặn variant trùng, publish rule; e2e: tạo SP 2 option → 6 variant → publish → thấy trên storefront → đổi slug → link cũ 301.

**Phục hồi & rollback**: nhập sai hàng loạt (import CSV nhầm giá) → khôi phục từ audit log `before` (owner-only, có màn revert theo batch id của lần import).

**Scale/tiến hóa**: > 10.000 SKU → chuyển search sang Meilisearch (M12 đã chừa); thuộc tính lọc phức tạp → bảng EAV chuẩn hóa thay jsonb (đắt, chỉ làm khi filter jsonb chậm thật).

**Code**: `src/modules/catalog/*`, `src/app/(storefront)/{danh-muc,san-pham,thuong-hieu}/*`, `src/app/admin/products/*`.

**Câu hỏi trước khi code**: Vì sao SP không option vẫn phải có 1 variant? Vì sao giá nằm ở variant chứ không ở product? GENERATED column là gì? Vì sao snapshot ở order_items cho phép archive thay vì cấm xóa?

---

## 2.4. M04 — Inventory & stock movements

**Mục đích & vai trò**: Trả lời chính xác "còn bao nhiêu cái?" tại mọi thời điểm, kể cả khi 2 khách mua cùng lúc, và giải trình được "tại sao còn từng này?" (kiểm kho, lệch kho). Vai trò: hệ thống (trừ khi bán), admin (nhập/điều chỉnh), khách (thấy còn/hết).

**Use case**: nhập 20 máy về kho; 2 khách cùng bấm mua chiếc cuối cùng → đúng 1 người thành công; đơn VietQR quá 60' không thanh toán → tự hoàn kho; kiểm kho cuối tháng thấy lệch 1 → điều chỉnh có ghi lý do; hàng bị lấy làm linh kiện sửa chữa.

**Ranh giới & phụ thuộc**: sở hữu `inventory`, `stock_movements`, `locations`. Chỉ M04 được ghi 2 bảng này — M06/M07 gọi `inventory.deduct()/restock()`, không tự UPDATE. Phụ thuộc: M03 (variant).

**Dữ liệu**:
```
locations       (id, name, address, is_active)          -- MVP đúng 1 dòng
inventory       (id, variant_id FK, location_id FK, quantity int NOT NULL CHECK (quantity >= 0),
                 low_stock_threshold int DEFAULT 3)      UQ(variant_id, location_id)
stock_movements (id, variant_id, location_id, delta int NOT NULL,  -- +nhập/hoàn, −bán/hủy hàng
                 reason enum: purchase|sale|cancel_restock|adjustment|repair_part|initial,
                 ref_type text, ref_id uuid,             -- 'order', id đơn — truy vết 2 chiều
                 actor_id uuid NULL, note text)
                 Index: (variant_id, created_at), (ref_type, ref_id)
```
Mô hình: **`inventory.quantity` là số dư vật chất hóa (materialized truth); `stock_movements` là sổ cái append-only**. Giống tài khoản ngân hàng: số dư + sao kê.

**Bất biến** (học thuộc):
1. `inventory.quantity == SUM(stock_movements.delta)` theo từng (variant, location) — job đêm đối chiếu, lệch → alert (nghĩa là có code ghi tắt sai đường).
2. Không bao giờ âm kho — CHECK constraint là chốt chặn cuối; chặn chính bằng update nguyên tử:
   `UPDATE inventory SET quantity = quantity - $n WHERE variant_id=$v AND quantity >= $n` → 0 row = hết hàng → rollback toàn transaction đơn.
3. Mỗi movement bất biến sau khi ghi (không UPDATE/DELETE — trigger chặn như audit_logs).
4. Chính sách MVP: **trừ kho ngay khi tạo đơn** (mọi phương thức thanh toán); hoàn kho khi hủy/hết hạn. Không có cột `reserved` — bớt 1 khái niệm, đổi lấy việc hàng bị "giam" tối đa 60' bởi đơn treo (chấp nhận được ở 30 đơn/ngày).

**API/Actions + edge**: `deduct(items[], ref)` / `restock(items[], ref, reason)` / `adjust(variant, delta, note)` (owner hoặc staff + note bắt buộc); `receiveStock` (nhập hàng). Edge: hủy đơn 2 lần → hoàn kho 2 lần? — chặn bằng state machine đơn (transition hủy chỉ đi được 1 lần) + movement có `ref_id` nên đối chiếu được; variant archived còn tồn → vẫn bán được tới hết hoặc admin điều chỉnh về 0.

**Luồng dữ liệu**: Checkout service → (trong transaction đơn) `inventory.deduct` → UPDATE nguyên tử + INSERT movements → commit chung với order. PDP hiển thị "Còn hàng/Sắp hết/Hết hàng" (không hiện số chính xác — thông tin cạnh tranh + không cần thiết).

**AuthN/AuthZ**: adjust/receive: admin (adjustment ghi actor); deduct/restock: chỉ được gọi từ service khác, không có endpoint public.

**Threat & abuse**: oversell qua race (đã chặn bằng atomic update — đây là bài học concurrency số 1 của dự án); admin gian lận điều chỉnh kho (audit + trigger log + owner review weekly); bot giữ hàng bằng cách spam đơn VietQR không trả tiền (rate limit checkout + Turnstile + auto-release 60' + chặn SĐT lạm dụng qua `customers.is_blocked`).

**Validation & lỗi**: qty nguyên dương, ≤ 100/món/đơn; lỗi hết hàng trả về đúng danh sách món thiếu để UI hiển thị "chỉ còn 1 chiếc".

**Hiệu năng**: update theo PK — nhanh; chú ý duy nhất: transaction đơn giữ lock các dòng inventory tới khi commit → giữ transaction NGẮN (không gọi API ngoài/email bên trong transaction — đẩy sang jobs).

**Observability**: cảnh báo sắp hết hàng (≤ threshold) trên dashboard; job đối chiếu ledger đêm; metric số lần deduct fail (đo mất doanh thu vì hết hàng).

**Tests**: **race test bắt buộc**: 2 request song song mua nốt 1 chiếc → đúng 1 thành công, kho = 0 (integration test với 2 connection thật); unit ledger sum; e2e nhập hàng → bán → hủy → kho về cũ.

**Phục hồi & rollback**: lệch kho thật (mất trộm/vỡ) → adjustment có note; nghi code sai → sổ cái cho phép dựng lại quantity tại bất kỳ thời điểm nào (replay movements).

**Scale/tiến hóa**: chi nhánh 2 → thêm dòng `locations` + UI chọn kho (schema sẵn); > 200 đơn/ngày kèm flash sale → cân nhắc cột `reserved` + reserve lúc thêm giỏ; POS tại quầy → bán tại quầy cũng đi qua `deduct` với `ref_type='pos'`.

**Code**: `src/modules/inventory/*`, `src/app/admin/inventory/*`.

**Câu hỏi trước khi code**: Vì sao `UPDATE ... WHERE quantity >= n` chặn được race mà `SELECT rồi UPDATE` thì không? Isolation level mặc định của Postgres là gì và đủ chưa (đủ — nhờ atomic update)? Vì sao không gọi email trong transaction?

---

## 2.5. M05 — Pricing, promotions, coupons

**Mục đích & vai trò**: Một nguồn sự thật duy nhất trả lời "món này, lúc này, giá bao nhiêu?" — mọi nơi (PDP, giỏ, checkout, đơn) hỏi cùng một hàm, không nơi nào tự tính. Vai trò: owner (đặt giá/KM), khách (hưởng), staff (chỉ xem).

**Use case**: đặt giá sale 22.990.000₫ (gạch 24.990.000₫) chạy 1/8–15/8 tự bật tự tắt; giảm 5% toàn bộ "Phụ kiện"; mã `KHAITRUONG` giảm 100k cho đơn từ 2 triệu, 100 lượt, 1 lượt/SĐT; khách áp mã lúc 23:59:58 — submit lúc 00:00:05 khi mã hết hạn.

**Ranh giới & phụ thuộc**: sở hữu promotions/coupons/coupon_redemptions + hàm `resolvePrice` & `priceOrder`. Không sở hữu giá gốc (`variants.price` — M03). Phụ thuộc M03. Được gọi bởi M06/M07.

**Dữ liệu**:
```
promotions (id, name, type: percent|fixed, value bigint, applies_to: all|category|product,
            target_ids uuid[], starts_at, ends_at, is_active)
            CHECK (type='percent' AND value BETWEEN 1 AND 90) OR (type='fixed' AND value > 0)
coupons    (id, code UQ citext, type percent|fixed, value, min_order_amount bigint,
            max_uses int, max_uses_per_customer int DEFAULT 1, used_count int DEFAULT 0,
            starts_at, ends_at, is_active)  CHECK (used_count <= max_uses)
coupon_redemptions (id, coupon_id, order_id UQ, customer_phone)  Index (coupon_id, customer_phone)
```

**Thuật toán giá — bất biến** (viết một lần trong `resolvePrice`, test kỹ):
1. Giá đơn vị = `variant.price`; nếu có nhiều promotion áp dụng được → **chọn 1 cái giảm sâu nhất, KHÔNG cộng dồn** (luật MVP, in rõ trong UI admin).
2. Coupon áp trên **subtotal sau promotion**; `min_order_amount` so với subtotal sau promotion.
3. Mọi phép tính trên bigint VND; phần trăm làm tròn XUỐNG (floor) — sai lệch làm tròn luôn có lợi cho khách để khỏi tranh cãi.
4. `grand_total = subtotal − coupon_discount + shipping_fee`, luôn ≥ 0; từng dòng `final_price ≥ 0`.
5. Giá chốt tại thời điểm **tạo đơn** (re-validate toàn bộ — không tin giá đã hiện ở giỏ).
6. Coupon trừ lượt nguyên tử: `UPDATE coupons SET used_count = used_count + 1 WHERE id=$1 AND used_count < max_uses AND is_active AND now() BETWEEN starts_at AND ends_at` → 0 row = hết lượt/hết hạn → báo khách, đơn không áp mã.

**API + edge cases**: `resolvePrice(variantId)`, `priceOrder(items, couponCode?, shippingZone)` — pure function trừ bước trừ lượt coupon; admin CRUD promotion/coupon (owner). Edge: mã hết hạn giữa chừng (bất biến 6 xử lý); 2 khách cùng lượt cuối (atomic — 1 người được); promotion percent trên hàng đã sale (chọn sâu nhất, không chồng); mã nhập hoa/thường (citext); khách đổi SĐT để vượt per-customer limit (chấp nhận rủi ro MVP — per-phone là đủ tốt, ghi nhận là known gap).

**Luồng dữ liệu**: PDP/giỏ gọi `resolvePrice` khi render (server); checkout gọi `priceOrder` trong transaction đơn; kết quả snapshot vào `order_items` (unit_price, discount, final_price) + `orders` (subtotal, discount_total, shipping_fee, grand_total).

**AuthZ**: promotion/coupon: owner-only (staff xem). **Threat**: brute-force dò mã coupon → rate limit endpoint áp mã 5 lần/phút/IP + mã ≥ 6 ký tự không đoán được (không dùng `SALE10` cho mã giới hạn lượt); nhân viên tuồn mã nội bộ (audit tạo mã, báo cáo redemption theo mã).

**Validation & lỗi**: lỗi mã trả thông điệp phân biệt được: hết hạn / chưa đến ngày / hết lượt / chưa đạt đơn tối thiểu / không tồn tại (2 cái cuối gộp làm một để khỏi lộ mã tồn tại).

**Hiệu năng**: promotions active load 1 query + cache request-scope; không N+1 khi tính giỏ nhiều món.

**Observability**: audit đổi giá (trigger M10); báo cáo: doanh thu theo mã, số đơn dùng KM.

**Tests**: unit `priceOrder` là bộ test dày nhất dự án (bảng test case: không KM, 1 KM percent, 2 KM chồng, KM + coupon, min chưa đạt, floor rounding, giỏ 0₫); race test coupon lượt cuối; e2e áp mã ở checkout.

**Phục hồi**: đặt nhầm promotion (giảm 90% thay vì 9%) → nút tắt ngay (is_active=false, revalidate tag toàn catalog); đơn đã trót đặt giá sai → xử lý thủ công từng đơn (gọi khách), audit làm bằng chứng; **cảnh báo trước khi lưu**: promotion làm giá thấp hơn `cost_price` → confirm riêng.

**Scale/tiến hóa**: stacking rules, flash sale đếm ngược, giá theo nhóm khách (B2B) — đều là Phase 2+; thiết kế hiện tại chịu được vì mọi nơi đi qua `priceOrder`.

**Code**: `src/modules/pricing/*`, `src/app/admin/{promotions,coupons}/*`.

**Câu hỏi trước khi code**: Vì sao floor mà không round? Vì sao coupon check-và-trừ phải là 1 câu UPDATE? Vì sao giá phải re-validate lúc tạo đơn dù giỏ vừa hiển thị?

---

## 2.6. M06 — Guest cart & checkout

**Mục đích & vai trò**: Chuyển ý định mua thành đơn hàng hợp lệ với ít ma sát nhất (guest, mobile-first) mà không cho phép bất kỳ gian lận giá/kho nào. Đây là màn quyết định doanh thu. Vai trò: khách anonymous (chính), hệ thống.

**Use case**: thêm giỏ từ PDP → sửa số lượng → checkout 1 trang → chọn COD → xong trong < 2 phút trên điện thoại; khách quay lại sau 3 ngày giỏ vẫn còn; món trong giỏ hết hàng/đổi giá trước khi đặt; bấm "Đặt hàng" 2 lần do mạng lag.

**Ranh giới & phụ thuộc**: sở hữu carts/cart_items + action `placeOrder` (điều phối). Phụ thuộc: M03 (variant), M04 (deduct), M05 (priceOrder), M07 (tạo order), M08 (khởi tạo payment), M11 (email). `placeOrder` là **transaction script trung tâm của cả hệ thống** — nơi mọi module gặp nhau.

**Dữ liệu**:
```
carts      (id, session_token UQ,           -- random 128-bit, đặt trong cookie httpOnly
            customer_id NULL, expires_at)   -- 30 ngày, gia hạn mỗi lần đụng
cart_items (id, cart_id FK CASCADE, variant_id FK, quantity int CHECK 1..100)
            UQ(cart_id, variant_id)
addresses tĩnh: JSON danh mục 34 tỉnh/thành + phường/xã (mô hình 2 cấp, xem A6) trong repo
```
**Cố ý KHÔNG lưu giá trong cart_items** — giá là output của M05 lúc render/lúc đặt. Giỏ chỉ là "ý định".

**Luồng `placeOrder` — 12 bước (thuộc lòng trước khi code)**:
```
 1. Rate limit (IP + session): 5 đơn/phút        → 429
 2. Verify Turnstile token (server-side)          → lỗi bot
 3. Zod: tên, SĐT (regex đầu số VN ^(0|\+84)(3|5|7|8|9)\d{8}$), tỉnh/xã thuộc danh mục,
    địa chỉ 5–200 ký tự, phương thức thanh toán hợp lệ, idempotency_key uuid
 4. Idempotency: orders.idempotency_key UQ — trùng → trả về đơn đã tạo (không tạo đôi)
 5. Load giỏ theo session_token, join variants còn is_active
 6. priceOrder(items, coupon?, zone)  ← M05: giá + KM + ship server-side
 7. BEGIN TRANSACTION
 8.   inventory.deduct(items)         ← M04: atomic; thiếu món nào abort, trả danh sách
 9.   coupon claim (nếu có)           ← M05: atomic
10.   INSERT orders + order_items (snapshot) + payments(pending) + upsert customers(phone)
      + order_status_history(pending)
11. COMMIT
12. Sau commit: enqueue email job, xóa giỏ, revalidate tag tồn kho;
    trả về: COD → trang thành công | VietQR → trang QR | VNPay → URL redirect
```

**Bất biến**: client chỉ gửi (variant_id, qty, coupon_code, address, payment_method, idempotency_key) — **không bao giờ gửi giá**; mọi con số tiền trên đơn sinh ra ở bước 6 trong server; bước 8–10 chung 1 transaction (kho trừ mà đơn không tạo = không thể xảy ra).

**AuthN/AuthZ**: anonymous với session cookie; cart RLS: chỉ service role đụng (client không query trực tiếp bảng carts).

**Threat & abuse**:

| Tấn công | Chống |
|---|---|
| Sửa giá ở client (curl giả payload) | Server không đọc giá từ client — test tamper bắt buộc |
| Double-submit → 2 đơn | idempotency_key UQ (bước 4) |
| Bot đặt đơn rác COD phá kho | Turnstile + rate limit + auto-release + `is_blocked` theo SĐT |
| Giữ giỏ số lượng lớn chờ giá đổi | Giỏ không khóa giá, không khóa kho — vô hại |
| Enumerate coupon tại checkout | rate limit riêng cho nhánh áp mã |

**Validation & lỗi**: mọi lỗi bước 1–9 trả `{ok:false, code, detail}` để UI hiển thị đúng chỗ (SĐT sai → dưới ô SĐT; hết hàng → tại dòng món đó với số còn lại; giá đổi → banner "giá đã cập nhật" + tổng mới, yêu cầu bấm đặt lại).

**Hiệu năng**: trang checkout server-render 1 lần + client component form; danh mục địa chính là JSON tĩnh import sẵn (0 API call); transaction ngắn (< 100ms — không I/O ngoài trong transaction).

**Observability**: funnel GA4 (`begin_checkout`, `add_payment_info`, `purchase`); log lý do fail đặt đơn theo code (đo mất đơn do hết hàng vs bot vs lỗi).

**Tests**: unit Zod schemas; integration `placeOrder` (happy, hết hàng giữa chừng, coupon race, idempotency, tamper giá); e2e Playwright mobile viewport: PDP → giỏ → COD xong; race 2 người 1 sản phẩm.

**Phục hồi & rollback**: feature flag `checkout_enabled` trong settings — sự cố nghiêm trọng → tắt checkout, storefront thành catalog + hotline, không cần deploy; transaction đảm bảo không có trạng thái nửa vời cần dọn.

**Scale/tiến hóa**: giỏ sang khách đăng nhập (Phase 1.5): merge giỏ cookie vào customer khi login; > 200 đơn/ngày: xem lại lock contention trên inventory các SKU hot (giải pháp: hàng đợi theo SKU — chưa cần thiết kế trước).

**Code**: `src/modules/cart/*`, `src/app/(storefront)/{gio-hang,thanh-toan}/*`.

**Câu hỏi trước khi code**: Idempotency key ai sinh, sống bao lâu, tại sao UNIQUE ở DB chứ không check ở app? Điều gì xảy ra nếu server chết giữa bước 10? (transaction chưa commit → không có gì được ghi → khách bấm lại, idempotency_key mới hay cũ?) Vì sao giỏ không lưu giá?

---

## 2.7. M07 — Orders & fulfillment

**Mục đích & vai trò**: Vòng đời đơn từ lúc sinh tới lúc xong/hủy, mỗi bước có người chịu trách nhiệm, có dấu vết, có tác dụng phụ đúng (email, hoàn kho). Vai trò: admin (điều khiển), khách (theo dõi), hệ thống (tự động hóa).

**Use case**: admin nghe notification đơn mới → gọi xác nhận → đóng gói tạo vận đơn GHN (thủ công, dán mã) → chuyển "Đang giao" → khách nhận → "Hoàn tất"; khách gọi hủy trước khi gửi; giao thất bại (bom hàng COD); khách tra cứu đơn không cần tài khoản.

**Ranh giới & phụ thuộc**: sở hữu orders/order_items/order_status_history/shipments/customers(+addresses). Phụ thuộc M04 (hoàn kho khi hủy), M08 (trạng thái payment ảnh hưởng transition), M11 (email).

**Dữ liệu** (bổ sung so với schema cũ):
```
orders   (id, code UQ,        -- 'DH' + 8 ký tự Crockford base32 random, retry nếu trùng
          customer_id, status, subtotal, discount_total, shipping_fee, grand_total,
          coupon_code, payment_method, shipping_snapshot jsonb (tên/SĐT/địa chỉ đóng băng),
          idempotency_key UQ, note, source, cancelled_reason, placed_at)
          Index: (status, placed_at DESC), (customer_id), trgm(code) cho tìm nhanh admin
order_items / order_status_history / shipments / customers / addresses: như bản trước
```

**State machine — bảng transition là NGUỒN SỰ THẬT (mọi chuyển trạng thái qua hàm `transition(order, to, actor)`; UPDATE status trực tiếp bị cấm về mặt quy ước + không có code path nào làm)**:

| Từ → Đến | Ai được phép | Tác dụng phụ |
|---|---|---|
| pending → confirmed | admin; hệ thống (khi payment paid) | email "đã xác nhận" |
| pending → cancelled | admin; hệ thống (hết hạn thanh toán); khách (qua hotline→admin) | **hoàn kho**, hoàn lượt coupon, email |
| confirmed → processing | admin | — |
| processing → shipping | admin (nhập mã vận đơn → tạo shipments) | email kèm mã vận đơn |
| shipping → delivered | admin | email |
| delivered → completed | admin; hệ thống (auto sau 3 ngày) | mở bảo hành (M09/warranties) |
| shipping → delivery_failed | admin (bom hàng) | quay về processing (giao lại) hoặc → cancelled (hoàn kho) |
| confirmed/processing → cancelled | admin | hoàn kho + coupon, email |
| delivered → refund_requested → refunded | owner | quy trình tay + audit |

Bất biến: transition ngoài bảng = exception + Sentry; hủy chỉ hoàn kho ĐÚNG MỘT LẦN (transition đi một chiều); đơn `paid` không được hủy bởi ai ngoài owner (vì kéo theo refund).

**API/Actions + ví dụ**: admin `transitionOrder`, `addTrackingCode`, `cancelWithReason`; khách: tra cứu POST `/don-hang/tra-cuu` `{code:'DH7K2M9QAB', phone:'0912345678'}` → 200 chỉ khi khớp CẢ HAI → trả view tối giản (trạng thái, món, tổng, timeline) — sai 1 trong 2 → lỗi chung "không tìm thấy", rate limit 10 lần/phút/IP chống dò.

**Luồng dữ liệu**: admin bấm nút → action → `transition()` trong transaction (status + history + side effect DB) → enqueue email → revalidate trang tra cứu (không cache).

**AuthZ**: bảng transition có cột "ai"; refund owner-only + re-prompt TOTP.

**Threat & abuse**: dò đơn (code random + cần SĐT khớp + rate limit); nhân viên sửa đơn xóa dấu vết (history append-only + audit); bom hàng COD hàng loạt từ 1 SĐT (`customers.is_blocked`, rule cảnh báo SĐT có ≥ 2 đơn delivery_failed).

**Validation & lỗi**: chuyển trạng thái sai → thông báo "đơn đang ở X, không thể sang Y" chứ không lỗi câm.

**Hiệu năng**: list admin phân trang + filter theo status (index); đếm badge "đơn chờ" 1 query COUNT nhỏ.

**Observability**: dashboard đếm theo trạng thái; alert đơn pending > 2h chưa ai đụng (khách đang chờ!); mọi transition trong history + audit.

**Tests**: unit: toàn bộ ma trận transition (hợp lệ + bất hợp lệ); integration: hủy → kho hoàn đúng, hoàn coupon; e2e: vòng đời đầy đủ pending→completed; security: tra cứu sai SĐT không lộ gì.

**Phục hồi & rollback**: chuyển nhầm trạng thái → transition ngược dành cho owner (delivered → shipping) có note bắt buộc, audit ghi; dữ liệu đơn không bao giờ sửa số tiền sau khi tạo (sai giá → hủy đơn, tạo đơn mới).

**Scale/tiến hóa**: API GHN (Phase 2): tạo vận đơn tự động + webhook cập nhật shipping→delivered; partial fulfillment (tách kiện) — không làm cho tới khi có nhu cầu thật.

**Code**: `src/modules/orders/*`, `src/app/admin/orders/*`, `src/app/(storefront)/don-hang/tra-cuu/*`.

**Câu hỏi trước khi code**: Tại sao side effect (hoàn kho) phải nằm trong cùng transaction với đổi status, còn email thì phải nằm NGOÀI? Tại sao mã đơn không dùng số tăng dần?

---

## 2.8. M08 — Payments: COD, VietQR, VNPay (MoMo → Phase 2, chờ duyệt D4)

**Mục đích & vai trò**: Nhận tiền đúng số, đúng đơn, có bằng chứng, không bao giờ tin dữ liệu chưa verify. **Không chạm dữ liệu thẻ** — thẻ nhập trên trang của cổng (ngoài phạm vi PCI của ta). Vai trò: khách (trả), owner (đối soát/refund), cổng thanh toán (báo kết quả), hệ thống.

**Use case**: COD — thu khi giao; VietQR — khách quét QR đúng số tiền + nội dung, owner thấy tiền vào tài khoản → bấm xác nhận khớp; VNPay — redirect sang cổng, khách trả, IPN server-to-server báo về, đơn tự sang confirmed; khách trả tiền xong nhưng tắt trình duyệt trước khi quay lại; VNPay gửi IPN 2 lần; số tiền IPN lệch với đơn.

**Ranh giới & phụ thuộc**: sở hữu payments/webhook_events + interface `PaymentProvider`. Phụ thuộc M07 (đơn), M11 (cron truy vấn đơn treo). Adapter pattern — thêm cổng mới = thêm 1 file, không sửa core:
```ts
interface PaymentProvider {
  createIntent(order): { kind:'none' } | { kind:'qr', payload } | { kind:'redirect', url }
  verifyIpn(rawBody, headers|params): { valid, txnRef, amount, providerTxnId, success }
  queryStatus(order): PaymentStatus          // đối soát chủ động đơn treo
}
```

**Dữ liệu**:
```
payments (id, order_id FK, provider: cod|vietqr|vnpay|momo, amount bigint,
          status: pending|paid|failed|expired|refunded,
          provider_txn_id, UQ(provider, provider_txn_id),
          paid_at, raw_response jsonb, reconciled_by NULL, reconciled_at NULL)
webhook_events (id, provider, event_key, UQ(provider, event_key),   -- idempotency
                payload jsonb, signature_valid bool, processed_at, result text)
```

**State machine payment**: `pending → paid | failed | expired`; `paid → refunded` (owner). Bất biến:
1. Một đơn có tối đa MỘT payment `paid` (partial unique index `ON payments(order_id) WHERE status='paid'`).
2. `paid` chỉ đến từ: (a) IPN verify chữ ký thành công **và amount khớp `orders.grand_total`**, hoặc (b) owner xác nhận thủ công VietQR (ghi `reconciled_by`). ReturnURL (trình duyệt khách quay về) KHÔNG BAO GIỜ đánh dấu paid — chỉ để hiển thị.
3. IPN xử lý idempotent: `INSERT webhook_events ... ON CONFLICT DO NOTHING` — conflict → đã xử lý → trả success cho cổng, không làm gì thêm.
4. amount lệch → payment giữ pending + cờ `mismatch` + alert owner — không bao giờ tự paid, không bao giờ tự refund.

**Chi tiết từng provider**:
- **COD**: `createIntent → none`; paid ghi nhận khi đơn `delivered` (admin xác nhận thu). Rủi ro bom hàng xử lý ở M07. Rule: đơn > 20 triệu hoặc SĐT mới → gọi xác nhận trước khi gửi.
- **VietQR**: sinh chuỗi EMVCo (bank BIN + số TK từ `settings`, amount, nội dung `DH XXXXXXXX`) → render QR tại client bằng thư viện QR (không gọi API ngoài, không phụ thuộc dịch vụ thứ ba). Màn đối soát admin: danh sách payment pending kèm số tiền + nội dung kỳ vọng; owner so với app ngân hàng rồi bấm khớp (2 chạm + confirm). Cron 60' expire đơn chưa xác nhận (→ M07 hủy + hoàn kho). Phase 2: webhook SePay/Casso đọc biến động số dư → khớp tự động theo nội dung CK.
- **VNPay** (redirect): build URL với `vnp_TxnRef` = mã đơn, `vnp_Amount` = grand_total × 100, ký **HMAC-SHA512** trên chuỗi param đã sort alphabet; IPN (server-to-server GET) → verify chữ ký → check amount → check đơn tồn tại & chưa paid → cập nhật → trả JSON đúng format cổng yêu cầu (`{"RspCode":"00","Message":"Confirm Success"}`; đã xử lý rồi → `"02"`; sai chữ ký → `"97"`). Học sandbox + bảng mã lỗi trong docs VNPay trước khi code; danh sách test case sandbox của họ là acceptance chính thức của M3.
- **MoMo** (Phase 2 nếu D4 duyệt): AIO v2, ký HMAC-SHA256, IPN POST JSON, resultCode 0 = thành công — cùng interface, 1 file mới.

**Ví dụ IPN VNPay (rút gọn) + phản ứng đúng**:
```
GET /api/webhooks/vnpay?vnp_TxnRef=DH7K2M9QAB&vnp_Amount=2499000000
    &vnp_ResponseCode=00&vnp_TransactionNo=14226112&vnp_SecureHash=9f2a…
→ verify hash: OK → tra đơn DH7K2M9QAB: grand_total=24.990.000 → 24990000×100 khớp
→ webhook_events insert OK (chưa từng xử lý) → payment paid, order → confirmed
→ 200 {"RspCode":"00","Message":"Confirm Success"}
```
**Edge cases bắt buộc xử lý**: IPN đến trước khi khách quay lại (trang kết quả poll DB, không chờ redirect); IPN retry (idempotent); khách trả 2 lần cho 1 đơn (payment 2 bị chặn bởi partial unique → ghi event + alert refund tay); IPN cho đơn đã hết hạn hủy (tiền đã trừ của khách → alert owner refund, KHÔNG tự hồi sinh đơn — kho có thể đã bán người khác); sandbox key lộ trong repo (chỉ env; key production nhập thẳng Vercel, không qua file).

**Luồng dữ liệu**: checkout (M06 bước 12) tạo payment pending → provider intent → khách đi → IPN về route handler (raw body, KHÔNG qua Zod trước khi verify chữ ký — verify trên raw) → service → transaction (payment + order transition) → job email.

**AuthZ**: webhook route: không session — chữ ký LÀ authentication; màn đối soát + refund: owner + TOTP re-prompt.

**Threat**: giả IPN (chữ ký sai → từ chối + log + alert nếu > 10/giờ — có kẻ đang thử); replay IPN (idempotency); sửa amount (so khớp DB); MITM (HTTPS-only, HSTS); nội bộ đánh dấu khống VietQR (audit `reconciled_by` + sao kê ngân hàng là bằng chứng độc lập — đối chiếu cuối tuần).

**Validation & lỗi**: mọi nhánh lỗi IPN đều trả đúng mã cổng quy định (trả sai → cổng retry vô hạn hoặc ngừng gửi — đọc kỹ docs); lỗi hệ thống khi xử lý IPN → 500 để cổng retry (đừng nuốt).

**Hiệu năng**: không đáng kể ở quy mô này; điều duy nhất: xử lý IPN < 5s (cổng có timeout).

**Observability**: bảng đối soát: payment không khớp đơn nào / đơn paid thiếu payment; log mọi webhook (kể cả invalid); cron `queryStatus` đơn pending > 15' (phòng IPN thất lạc); alert mismatch ngay lập tức.

**Tests**: unit: build/verify chữ ký từng provider với vector cố định (lấy từ sandbox thật, ghi vào fixture); integration: replay 2 IPN → 1 lần xử lý; amount lệch → mismatch; IPN đơn hết hạn → alert không hồi sinh; e2e sandbox VNPay full flow; security: POST chữ ký sai → 200 RspCode 97 + không đổi gì trong DB.

**Phục hồi & rollback**: feature flag từng provider trong `settings` (`vnpay_enabled=false` → checkout chỉ còn COD/VietQR, không deploy); đánh dấu paid nhầm → owner revert có audit + quy trình xin lỗi khách trong RUNBOOK.

**Scale/tiến hóa**: MoMo/ZaloPay = file mới; trả góp (Fundiin/Kredivo) = provider mới cùng interface; đối soát tự động VietQR (SePay) thay màn thủ công.

**Code**: `src/modules/payments/{index,cod,vietqr,vnpay}.ts`, `src/app/api/webhooks/vnpay/route.ts`, `src/app/admin/reconciliation/*`.

**Câu hỏi trước khi code**: Vì sao verify chữ ký phải trên raw body/param gốc chứ không phải sau khi parse? Vì sao returnURL không được tin? Idempotency key của VNPay là gì trong hệ ta (`provider_txn_id`? `TxnRef`+`TransactionNo`?) — quyết định và ghi vào PAYMENTS.md. Tiền đã trừ của khách nhưng đơn đã hủy — quy trình con người là gì?

---

## 2.9. M09 — Repair booking, tickets, tracking

**Mục đích & vai trò**: Kênh nhận khách sửa chữa có trật tự (thay vì chỉ gọi điện), minh bạch tiến độ, dữ liệu nền cho quy trình báo giá đầy đủ ở Phase 2. Vai trò: khách vãng lai (đặt, tra), admin (vận hành), kỹ thuật viên = staff (Phase 2 role riêng).

**Use case**: khách đặt lịch "iPhone 13 vỡ màn" chọn khung 14–16h thứ 7 → nhận mã `SC-A7K2MQ` → admin gọi xác nhận → khách mang máy tới → cập nhật trạng thái từng bước, mỗi bước khách tra cứu thấy → trả máy + ghi giá cuối; khách không tới (no-show); slot đầy; khách gửi ảnh tình trạng máy.

**Ranh giới & phụ thuộc**: sở hữu repair_services/appointment_slots/repair_tickets/repair_status_history/warranties(+quotes Phase 2). Phụ thuộc: M11 (email), M13 (ảnh private). Độc lập hoàn toàn chuỗi bán hàng — làm song song M08b.

**Dữ liệu**:
```
repair_services   (id, name, device_type, price_from, price_to, duration_estimate, is_active)
appointment_slots (id, date, time_range, capacity int, booked_count int,
                   CHECK (booked_count <= capacity))     -- admin mở slot theo tuần
repair_tickets    (id, code UQ 'SC'+6 base32, customer_name, phone, email NULL,
                   device_type, device_model, issue_description, images jsonb,
                   slot_id FK NULL, status, admin_note,   -- note nội bộ KHÔNG hiện cho khách
                   public_note,                           -- dòng hiện cho khách khi tra cứu
                   final_price bigint NULL)
repair_status_history (ticket_id, from, to, actor_id, note, notified bool)
warranties        (id, order_item_id NULL, repair_ticket_id NULL, serial_no, starts_at,
                   expires_at, terms)   CHECK (order_item_id IS NOT NULL OR repair_ticket_id IS NOT NULL)
```

**State machine**: `new → confirmed → received → repairing → done → returned`; nhánh: `new/confirmed → cancelled` (khách hủy/no-show); `repairing → waiting_parts → repairing` (chờ linh kiện — thêm vì rất hay xảy ra thật). Bất biến: đặt slot nguyên tử `UPDATE appointment_slots SET booked_count = booked_count+1 WHERE id=$1 AND booked_count < capacity` → 0 row = đầy; `returned` yêu cầu `final_price NOT NULL` (kể cả 0 = bảo hành/không sửa được).

**API + edge**: public: `bookRepair` (Turnstile + rate limit 3/giờ/IP), `trackTicket(code, phone)` — same pattern tra cứu đơn; admin: board theo trạng thái (kanban-lite), `transitionTicket(note, notify?)` — tick notify → job email public_note cho khách. Edge: no-show → cancelled sau ngày hẹn (cron nhắc admin, không tự hủy — có thể khách đến muộn); khách không có email → mã hiện trên màn hình + khuyến khích chụp lại + tra cứu bằng SĐT; đổi lịch → hoàn slot cũ + trừ slot mới nguyên tử.

**AuthZ**: khách chỉ thấy view rút gọn (trạng thái + public_note + giá cuối khi done); `admin_note`, ảnh nội bộ, giá vốn linh kiện — không bao giờ ra ngoài (tách rõ 2 query, không dùng chung serializer).

**Threat**: spam booking chiếm slot (Turnstile + rate limit + capacity + SĐT trùng đang có ticket mở → chặn tạo thêm); dò phiếu người khác (code+phone+rate limit); ảnh khách upload chứa mã độc (M13: quarantine + re-encode); PII trong mô tả lỗi (retention M14: ticket ẩn danh hóa sau 2 năm).

**Validation**: device_type từ danh sách; mô tả 10–1000 ký tự; ảnh ≤ 3 cái ≤ 4MB.

**Hiệu năng**: không đáng kể; trang tra cứu không cache.

**Observability**: dashboard "lịch hôm nay"; alert ticket `new` > 30' chưa gọi (giờ làm việc); đếm no-show theo tháng.

**Tests**: race 2 người slot cuối; unit transition; e2e đặt → xử lý → tra cứu; security: tra cứu sai phone.

**Phục hồi & rollback**: flag `repairs_enabled` ẩn khỏi nav — không ảnh hưởng bán hàng; xóa nhầm slot đã có khách → chặn (FK RESTRICT), phải dời ticket trước.

**Scale/tiến hóa**: Phase 2: quotes online (bảng đã có) → khách duyệt giá qua link ký (signed URL + OTP SĐT) → warranty sửa chữa in mã QR tra cứu; role `technician`; nhận máy qua ship.

**Code**: `src/modules/repairs/*`, `src/app/(storefront)/sua-chua/*`, `src/app/admin/repairs/*`.

**Câu hỏi trước khi code**: Vì sao tách `admin_note` / `public_note` từ đầu? Slot race giống inventory race chỗ nào (cùng một bài học)? Warranty CHECK "một trong hai FK" hoạt động ra sao?

---

## 2.10. M10 — Admin dashboard & audit logging

**Mục đích & vai trò**: Buồng lái một-người: thấy ngay việc cần làm hôm nay, và mọi hành động nhạy cảm để lại dấu vết không xóa được (bảo vệ bạn khỏi chính sai lầm của bạn, và khỏi staff sau này). Vai trò: owner, staff (theo ma trận M02).

**Use case**: sáng mở dashboard: 3 đơn chờ, 2 CK chờ đối soát, 1 lịch sửa hôm nay, 4 SKU sắp hết; tháng sau phát hiện giá SP bị sửa lạ → tra audit ai/khi nào/từ giá nào; staff mới thao tác sai → khôi phục theo dấu vết.

**Ranh giới & phụ thuộc**: sở hữu audit_logs + settings + layout admin + dashboard queries. Mọi module admin khác "cắm" trang vào layout này. Phụ thuộc M02.

**Dữ liệu**:
```
audit_logs (id, actor_id NULL, actor_role, action text,        -- 'product.price.update'
            entity text, entity_id uuid, before jsonb, after jsonb,
            ip inet, user_agent, created_at)
            Index: (entity, entity_id, created_at DESC), (actor_id, created_at DESC)
settings   (key UQ, value jsonb, updated_by, updated_at)       -- ship_fee, bank_account,
            feature flags (checkout_enabled, vnpay_enabled…), hotline, policy text
```
**Hai đường ghi audit** (hiểu kỹ sự khác nhau):
1. **DB trigger** trên `product_variants` (price, cost_price), `inventory` (quantity), `coupons`, `settings` — bắt MỌI thay đổi kể cả code quên gọi, actor lấy từ `SET LOCAL app.actor_id` mà service đặt đầu transaction.
2. **App-level** cho hành động nghiệp vụ có ngữ cảnh (order.transition, refund, admin.deactivate) — giàu ngữ nghĩa hơn trigger.

**Bất biến**: audit_logs & repair/order history append-only — trigger `BEFORE UPDATE OR DELETE ... RAISE EXCEPTION` (vì service-role bỏ qua RLS nên RLS không đủ để chống sửa — trigger thì không bỏ qua được); mọi Server Action admin bắt đầu bằng `requireRole` và kết thúc bằng audit (viết dạng wrapper `adminAction(role, fn)` để không quên).

**Dashboard queries** (mỗi cái 1 SQL, có index chống chậm): doanh thu hôm nay/tuần (từ orders completed+delivered), đơn theo trạng thái, payment chờ đối soát, lịch sửa hôm nay, top SKU sắp hết, đơn pending quá 2h.

**AuthZ**: audit viewer owner-only; settings owner-only; dashboard cả hai (staff không thấy doanh thu? — quyết định nhỏ: MVP cho thấy, ghi vào DECISIONS-PENDING).

**Threat**: insider (staff) — ma trận quyền + audit + owner review; audit chứa PII trong before/after (chỉ owner đọc + retention 2 năm + không log password/token bao giờ); volume tăng (partition theo tháng khi > 1M dòng — chưa cần).

**Hiệu năng**: dashboard < 500ms tổng — mỗi widget 1 query index-backed, chạy song song (`Promise.all`).

**UI**: mobile-first thật sự (bạn chốt đơn ngoài quầy): đơn dạng card, action chính 1 chạm + confirm sheet; badge số đơn chờ trên bottom bar admin.

**Tests**: integration: sửa giá qua SQL thẳng (mô phỏng bug) → trigger vẫn ghi audit; sửa audit_logs → exception; e2e dashboard render đủ widget; unit dashboard queries với seed data.

**Phục hồi**: settings sai (đổi nhầm số TK ngân hàng!) → audit có before → revert 1 chạm (owner); mọi settings đổi → email owner tức thì (phát hiện chiếm quyền).

**Scale/tiến hóa**: staff nhiều hơn → phân quyền bảng-based; audit → warehouse (BigQuery) khi cần phân tích dài hạn.

**Code**: `src/modules/audit/*`, `src/app/admin/{layout,dashboard,settings,audit}/*`, `db/migrations/*_audit_triggers.sql`.

**Câu hỏi trước khi code**: Vì sao trigger cần `SET LOCAL app.actor_id` và nó hoạt động thế nào trong transaction? Vì sao RLS không chặn được service role còn trigger thì có? Append-only nghĩa là gì với backup size theo thời gian?

---

## 2.11. M11 — Notifications & background jobs

**Mục đích & vai trò**: Mọi việc "không cần xảy ra ngay trong request" (email, hết hạn đơn, đối chiếu) chạy đáng tin cậy, retry được, quan sát được — mà không cần message broker. Vai trò: hệ thống; khách/admin nhận email.

**Use case**: đơn tạo xong → email xác nhận đi trong ≤ 1 phút; email fail (Resend timeout) → retry 3 lần backoff; đơn VietQR 60' không xác nhận → hủy + hoàn kho; job lỗi liên tục → dừng + báo owner chứ không lặp vô hạn.

**Ranh giới & phụ thuộc**: sở hữu `jobs` + handlers + email templates. Mọi module enqueue qua `enqueue(type, payload, runAt?)`. Phụ thuộc: Resend, Vercel Cron. **Quy tắc vàng: enqueue nằm SAU commit transaction nghiệp vụ** (đơn chưa chắc tồn tại thì đừng hứa gửi email); hệ quả: có thể sót enqueue nếu crash đúng giữa commit và enqueue → cron quét lưới an toàn (đơn confirmed chưa có email log → enqueue lại).

**Dữ liệu & thuật toán claim (lõi của module)**:
```
jobs (id, type, payload jsonb, run_at, attempts int DEFAULT 0, max_attempts int DEFAULT 5,
      locked_at NULL, done_at NULL, last_error text)
      Index: (done_at, run_at) WHERE done_at IS NULL

-- Cron mỗi phút, claim chống trùng khi 2 cron chồng nhau:
UPDATE jobs SET locked_at = now(), attempts = attempts + 1
WHERE id IN (SELECT id FROM jobs
             WHERE done_at IS NULL AND run_at <= now()
               AND (locked_at IS NULL OR locked_at < now() - interval '5 minutes')
             ORDER BY run_at LIMIT 10
             FOR UPDATE SKIP LOCKED)
RETURNING *;
```
Semantics: **at-least-once** → mọi handler phải **idempotent** (gửi email 2 lần tệ nhưng chấp nhận; đánh dấu đã gửi trong payload/bảng để giảm thiểu). `attempts >= max_attempts` → dead-letter: giữ nguyên + email owner + hiện trong admin.

**Job types MVP**: `send_email` (template + to + data), `release_expired_order`, `expire_repair_reminder`, `verify_inventory_ledger` (đêm), `query_pending_payments` (15'), `refresh_sitemap` (đêm).

**Email templates** (Resend, from domain riêng đã SPF/DKIM/DMARC): xác nhận đơn, đổi trạng thái đơn, mã vận đơn, xác nhận lịch sửa, cập nhật phiếu sửa, cảnh báo owner (đơn mới, mismatch payment, dead-letter, settings đổi). Mỗi template: text-first, tiếng Việt, không tracking pixel bên thứ ba.

**Threat & lạm dụng**: cron endpoint lộ → yêu cầu header `CRON_SECRET` so sánh constant-time; email bomb qua form public (rate limit ở M06/M09 đã chặn nguồn); template injection (mọi biến escape — không render HTML từ input user).

**Observability**: bảng jobs chính là dashboard (đếm pending/failed); alert dead-letter > 0; log duration từng job.

**Tests**: unit claim query (2 worker giả không lấy trùng); integration: job fail 5 lần → dead-letter + không chạy nữa; e2e: đặt đơn → email tới (Resend test mode).

**Phục hồi**: retry nút bấm trong admin cho dead-letter; job kẹt lock (worker chết giữa chừng) → tự nhả sau 5' (điều kiện locked_at).

**Scale/tiến hóa**: > vài nghìn job/ngày hoặc cần job < 1 phút → chuyển worker thật (Railway) + pg-boss/BullMQ, bảng giữ nguyên; Zalo ZNS thêm 1 channel cạnh email.

**Code**: `src/modules/notifications/*`, `src/app/api/cron/process-jobs/route.ts`, `src/emails/*`.

**Câu hỏi trước khi code**: `FOR UPDATE SKIP LOCKED` làm gì? Vì sao at-least-once chứ không exactly-once (và vì sao exactly-once gần như là huyễn hoặc)? Vì sao enqueue sau commit + lưới an toàn thay vì transactional outbox đầy đủ (trả lời: outbox đúng hơn nhưng phức tạp hơn — biết tên pattern để nâng cấp sau)?

---

## 2.12. M12 — Search, SEO & product discovery

**Mục đích & vai trò**: Khách tìm là thấy (kể cả gõ không dấu, sai chính tả nhẹ), Google index đúng và đủ, không lãng phí crawl vào trang vô giá trị. Vai trò: khách, Googlebot, admin (nhập meta).

**Use case**: gõ "dien thoai iphon" → vẫn ra iPhone; lọc danh mục theo hãng + khoảng giá; đổi slug không chết link cũ; Google hiện giá + còn hàng ngay trên kết quả (rich result); trang filter `?hang=apple&gia=10-20tr` không làm loãng index.

**Ranh giới & phụ thuộc**: sở hữu cột `search_text`, hàm search, sitemap, robots, JSON-LD helpers, slug_redirects middleware. Phụ thuộc M03.

**Kỹ thuật search (Postgres — học kỹ phần này)**:
```sql
-- unaccent mặc định KHÔNG immutable → không dùng được trong GENERATED/index. Tạo wrapper:
CREATE FUNCTION immutable_unaccent(text) RETURNS text
  AS $$ SELECT public.unaccent('public.unaccent', $1) $$
  LANGUAGE sql IMMUTABLE PARALLEL SAFE;

ALTER TABLE products ADD COLUMN search_text tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(name,''))), 'A') ||
    setweight(to_tsvector('simple', immutable_unaccent(coalesce(brand_name_snapshot,''))), 'B')
  ) STORED;
CREATE INDEX ON products USING GIN (search_text);
CREATE INDEX ON products USING GIN (immutable_unaccent(name) gin_trgm_ops);

-- Query: FTS trước, trgm similarity fallback khi FTS 0 kết quả (bắt lỗi chính tả):
WHERE search_text @@ websearch_to_tsquery('simple', immutable_unaccent($q))
ORDER BY ts_rank(search_text, query) DESC
```
Ghi log query 0 kết quả (biết khách muốn gì mà mình không bán — dữ liệu nhập hàng!).

**SEO checklist thực thi** (mỗi mục là code cụ thể): slug không dấu chuẩn hóa; `generateMetadata` mọi trang (admin override được title/desc); JSON-LD `Product+Offer` (giá, priceCurrency VND, availability lấy từ tồn kho THẬT — sai là Google phạt rich result), `BreadcrumbList`, `LocalBusiness` (địa chỉ + giờ mở cửa + geo), `FAQPage` trang sửa chữa; sitemap.xml sinh từ DB (job đêm, chỉ URL published); robots chặn /admin,/api,/gio-hang,/thanh-toan,/tai-khoan,/don-hang; canonical tự trỏ trên trang filter (`?hang=` canonical về trang danh mục gốc — filter không index); 301 qua `slug_redirects` (middleware tra bảng trước khi 404); OG image mặc định + ảnh SP cho PDP.

**Threat/abuse**: search DoS bằng query dài/lạ → cắt 100 ký tự, rate limit 30/phút/IP, timeout query 2s; SEO-cloaking không bao giờ (nội dung bot = người); scraper (chấp nhận + rate limit).

**Validation**: q trim, escape (tsquery qua `websearch_to_tsquery` là an toàn injection — hiểu vì sao: nó parse như user input chứ không phải cú pháp tsquery thô).

**Hiệu năng**: search < 100ms với GIN ở 1.000 SKU (đo thật ở M1); suggest-as-you-type debounce 300ms + limit 5 (route handler riêng, cache 60s theo prefix phổ biến).

**Observability**: Search Console (submit sitemap, theo dõi coverage + Core Web Vitals); log top queries + 0-result.

**Tests**: unit slug; integration: tìm có dấu/không dấu/sai nhẹ ra cùng SP; e2e: đổi slug → 301; validate JSON-LD bằng schema validator trong CI (snapshot test).

**Phục hồi**: index hỏng/đổi công thức search_text → `REINDEX`/migration tạo lại cột (generated column tự tính lại).

**Scale/tiến hóa**: > 10.000 SKU hoặc cần facet count nhanh → Meilisearch (đồng bộ qua job sau mỗi thay đổi catalog — điểm cắm đã có: `revalidateTag` hook); blog/content SEO Phase 2 (MDX, không cần CMS vội).

**Code**: `src/modules/search/*`, `src/app/(storefront)/tim-kiem/*`, `src/app/{sitemap.ts,robots.ts}`, `src/lib/jsonld.ts`.

**Câu hỏi trước khi code**: Vì sao unaccent phải wrap IMMUTABLE? `'simple'` config khác `'english'` gì và vì sao tiếng Việt dùng simple? tsvector weight A/B ảnh hưởng rank thế nào? Canonical khác noindex khi nào?

---

## 2.13. M13 — Media upload & storage security

**Mục đích & vai trò**: Ảnh vào hệ thống qua đúng MỘT cửa, được làm sạch, đặt đúng chỗ công khai/riêng tư. File upload là vector tấn công kinh điển — module này là hàng rào. Vai trò: admin (ảnh SP — tin cậy có 2FA), khách sửa chữa (ảnh máy — KHÔNG tin cậy).

**Hai pipeline theo mức tin cậy (bài học thiết kế chính)**:
1. **Admin (trusted-ish)**: form admin → route handler (giới hạn 4MB — dưới trần body Vercel) → kiểm magic bytes (thư viện `file-type`, KHÔNG tin extension/Content-Type) → **sharp re-encode** ra WebP (max 2048px, strip EXIF/GPS — diệt mọi payload nhúng) → upload bucket `products` (public-read) → trả URL + bắt nhập alt.
2. **Khách sửa chữa (untrusted)**: xin presigned upload URL (giới hạn size + content-type, TTL 5') → upload thẳng lên bucket `quarantine` (private, không ai đọc) → job re-encode y như trên → chuyển sang bucket `repairs` (private-read) → gắn vào ticket → xóa bản quarantine. Admin xem qua **signed GET URL TTL 15'**.

**Dữ liệu/cấu hình**: key luôn là `uuid.webp` do server sinh (chặn path traversal + đoán tên); bucket policies: `products` public-read/service-write; `repairs`+`quarantine` private/service-only; cấm SVG tuyệt đối từ mọi nguồn (XSS vector); giới hạn: SP 10 ảnh, ticket 3 ảnh.

**Threat model**:

| Tấn công | Chống |
|---|---|
| Polyglot file (ảnh + script) | Re-encode bằng sharp — ảnh ra là ảnh mới hoàn toàn |
| SVG chứa JS | Cấm SVG |
| Bom giải nén / ảnh 50.000×50.000px | sharp `limitInputPixels` + timeout + giới hạn size trước khi decode |
| Đoán URL ảnh private | bucket private + signed URL TTL ngắn |
| Serve HTML từ storage domain | storage domain khác origin app + Content-Type do server đặt |
| EXIF lộ GPS nhà khách | strip metadata khi re-encode |

**Luồng dữ liệu, AuthZ**: pipeline 1 sau `requireRole`; pipeline 2 sau Turnstile của form booking (presigned chỉ cấp trong phiên đặt lịch hợp lệ).

**Validation & lỗi**: file quá to/sai loại → lỗi rõ trước khi upload (check client trước cho UX, server là chốt); job re-encode fail → ticket vẫn tạo được, ảnh đánh dấu lỗi (ảnh là phụ, đừng chặn nghiệp vụ).

**Hiệu năng**: ảnh SP serve qua `next/image` (AVIF/WebP, responsive sizes) + CDN; LCP ảnh hero preload.

**Observability**: đếm upload fail theo lý do; alert khi quarantine tồn file > 1h (job chết?).

**Tests**: fixture: file PHP đổi đuôi .jpg → bị chặn ở magic bytes; ảnh hợp lệ chứa EXIF GPS → output sạch; SVG → từ chối; integration presigned hết TTL → 403; e2e upload ảnh SP end-to-end.

**Phục hồi**: xóa nhầm ảnh → ảnh SP có trong backup storage? (Supabase Storage KHÔNG nằm trong pg_dump! → backup storage riêng: script rclone bucket → R2 hằng tuần — ghi vào M15); mất toàn bộ: re-upload từ máy bạn (giữ thư mục ảnh gốc local có tổ chức).

**Scale/tiến hóa**: nhiều ảnh/video → Cloudflare R2 + Images khi egress Supabase thành tiền; video SP Phase 3.

**Code**: `src/modules/media/*`, `src/app/api/{upload,presign}/route.ts`.

**Câu hỏi trước khi code**: Magic bytes là gì, vì sao Content-Type client vô nghĩa? Re-encode diệt payload kiểu gì? Vì sao presigned URL + quarantine cho khách còn admin thì synchronous?

---

## 2.14. M14 — Privacy, consent & tuân thủ TMĐT Việt Nam

**Mục đích & vai trò**: Thu đúng — dùng đúng — giữ đúng hạn — xóa được dữ liệu cá nhân; đủ nghĩa vụ pháp lý để không ăn phạt hành chính. Vai trò: khách (chủ thể dữ liệu), owner (bên kiểm soát dữ liệu), cơ quan quản lý.

**Data map (biết dữ liệu nằm đâu là bước 1 của mọi việc privacy)**:

| Dữ liệu | Bảng/nơi | Mục đích | Giữ bao lâu (đề xuất — kế toán/luật sư chốt) |
|---|---|---|---|
| Tên, SĐT, địa chỉ | customers, orders.shipping_snapshot | giao hàng, CSKH | đơn: theo nghĩa vụ kế toán (~10 năm — xác nhận); customer record: tới khi yêu cầu xóa |
| Email | customers, tickets | thông báo | như trên |
| Tình trạng thiết bị, ảnh máy | repair_tickets | sửa chữa | ẩn danh hóa sau 2 năm |
| IP, UA | audit_logs, login logs | an ninh | 90 ngày (login), 2 năm (audit) |
| Hành vi duyệt web | GA4 (bên thứ ba) | phân tích | theo cấu hình GA4 14 tháng |

**Nghĩa vụ pháp lý — bảng trạng thái (mỗi dòng: cần chuyên gia xác nhận = ⚠️)**:

| Nghĩa vụ | Căn cứ | Việc phải làm | Trạng thái |
|---|---|---|---|
| Thông báo website TMĐT bán hàng | NĐ 52/2013 + 85/2021 | Hồ sơ trên online.gov.vn khi mở bán; gắn logo footer | ⚠️ thủ tục + thời điểm |
| Bảo vệ DLCN | NĐ 13/2023 + **Luật BVDLCN 91/2025/QH15 (hiệu lực 01/01/2026)** | Chính sách bảo mật đúng nội dung luật; consent checkbox checkout + booking; quy trình đáp ứng yêu cầu truy cập/xóa; **hồ sơ đánh giá tác động xử lý DLCN**; **đánh giá chuyển DLCN ra nước ngoài (Supabase đặt tại Singapore!)** | ⚠️ **điểm nặng nhất — luật mới, phạm vi nghĩa vụ với hộ KD nhỏ cần luật sư chốt** |
| Bảo vệ NTD | Luật BVQLNTD 2023 | Điều khoản giao dịch từ xa, chính sách đổi trả hiển thị trước khi mua | ⚠️ nội dung điều khoản |
| Hóa đơn điện tử | NĐ 123/2020 + 70/2025 | Xác định diện áp dụng (máy tính tiền?) theo doanh thu/mô hình | ⚠️ **kế toán chốt trước khi mở bán** |
| Giá niêm yết gồm VAT, thông tin chủ thể | nhiều văn bản | Footer: tên, MST, địa chỉ, GPKD | ⚠️ danh mục thông tin bắt buộc |

**Cơ chế kỹ thuật phải build**: consent checkbox (không pre-tick) tại checkout + booking, lưu `consented_at` trong orders/tickets; cookie banner GA4 Consent Mode (analytics chỉ chạy sau đồng ý); action `anonymizeCustomer(phone)` owner-only: thay PII bằng `[đã xóa]` trong customers/addresses + shipping_snapshot của đơn NGOÀI thời hạn kế toán, giữ số liệu tài chính (đơn không PII vẫn là doanh thu hợp lệ); job retention: login logs > 90d xóa, tickets > 2 năm ẩn danh; trang chính sách render từ settings (sửa không cần deploy).

**Threat/abuse**: yêu cầu xóa giả mạo (xác minh chủ SĐT bằng OTP gọi/Zalo trước khi anonymize); nhân viên xuất data khách (export owner-only + audit).

**Tests**: e2e checkout không tick consent → không đặt được; anonymize → PII biến mất khỏi mọi view nhưng tổng doanh thu không đổi; GA4 script không load trước consent (kiểm bằng Playwright network).

**Câu hỏi trước khi code**: Sự khác nhau giữa "xóa" và "ẩn danh hóa" và vì sao kế toán cấm xóa đơn? Consent Mode của GA4 hoạt động ra sao? Câu hỏi cho luật sư đã liệt kê đủ chưa (0.4-R5)?

---

## 2.15. M15 — Performance, monitoring, backup & disaster recovery

> **Cập nhật 07/2026 theo quyết định của bạn**: hệ thống chạy trên **Supabase Free cho cả production** (không nâng Pro — xem 0.3/D2, 0.5, 0.5.1, 0.5.2). Module này viết lại để phần backup/DR không còn dựa vào tính năng trả phí nào của Supabase — mọi lớp phòng thủ dưới đây là tự vận hành.

**Mục đích & vai trò**: Trả lời 3 câu mọi lúc: hệ thống có sống không? — có chậm/lỗi bất thường không? — nếu mất sạch, khôi phục thế nào, mất tối đa bao nhiêu dữ liệu? Vai trò: bạn (SRE bất đắc dĩ), khách (hưởng SLO).

**Mục tiêu đo được**: uptime 99,5%/tháng (~3,6h downtime cho phép — thực tế cho solo, và có thêm rủi ro auto-pause riêng của Free tier — xem 0.5.1); p95 TTFB trang ISR < 200ms, checkout action < 800ms; **RPO** (mất dữ liệu tối đa): **4–6 giờ**, hoàn toàn dựa vào pg_dump tự vận hành (không có daily-backup/PITR của Supabase Pro làm lớp nền) — pg_dump chạy 4–6 giờ/lần qua GitHub Actions cron (free) đẩy sang R2/B2, nơi lưu ĐỘC LẬP nhà cung cấp DB; **RTO** (thời gian khôi phục): mục tiêu 4h, **phải đo bằng diễn tập thật hằng tháng** (không phải hằng quý — vì đây là lớp phòng thủ duy nhất).

**Giám sát 3 tầng + 1 tầng riêng cho rủi ro Free tier**: (1) uptime: BetterStack free ping `/api/health` (health check DB + storage + jobs lag) mỗi phút → SMS/email — đồng thời đóng vai trò giữ project "có hoạt động" để giảm khả năng auto-pause (xác minh thực nghiệm ở M0b); (2) lỗi: Sentry (server+client, scrub PII), alert lỗi mới/đột biến; (3) nghiệp vụ (thường bị quên): cron alert — đơn pending > 2h, payment mismatch, dead-letter jobs > 0, ledger lệch, 0 đơn trong 24h (nghi checkout hỏng âm thầm!); (4) **rủi ro đặc thù Supabase Free**: alert riêng khi kết nối DB thất bại 3 lần liên tiếp (nghi bị pause), alert usage DB/storage/egress chạm 80% giới hạn free tier (500MB/1GB/5GB) — chi tiết ở 0.5.2.

**Backup — mô hình mới, KHÔNG có lớp "Supabase daily" nữa; nguyên tắc "backup chưa restore thử = chưa có backup" càng quan trọng hơn khi chỉ còn 2 lớp tự làm**:
1. `pg_dump` toàn bộ DB, 4–6 giờ/lần (GitHub Actions cron), nén, đẩy R2/B2, giữ 14–30 bản xoay vòng.
2. Storage ảnh: `rclone sync` bucket Supabase → R2/B2 hằng tuần (hằng ngày trong giai đoạn nhập catalog dồn dập ở M1) — pg_dump KHÔNG chứa ảnh.
3. **Diễn tập restore mỗi tháng** (không phải mỗi quý) ra project Supabase Free tạm hoặc Postgres local, chạy smoke test đọc dữ liệu, ghi biên bản thời gian thật vào RUNBOOK — đây là RTO thật của bạn, không phải con số lý thuyết.

Đánh đổi đã được bạn chấp nhận tường minh (không phải lỗ hổng bị bỏ sót): không có PITR, không có snapshot tức thời của nhà cung cấp — nếu sự cố xảy ra ngay trước lần pg_dump kế tiếp, mất tối đa dữ liệu của 4–6 giờ đó.

**Kịch bản thảm họa (bảng DR trong RUNBOOK, mỗi dòng có các bước cụ thể)**:

| Kịch bản | Ứng phó |
|---|---|
| Vercel outage | Chờ (status page); storefront là ISR nên phần đã cache có thể còn sống; hotline + fanpage thông báo |
| **Project Supabase Free bị auto-pause** (rủi ro riêng của tier này) | Vào dashboard bấm resume ngay khi alert "kết nối DB thất bại 3 lần" kêu; ghi nhận thời điểm phát hiện − thời điểm pause thật (từ log) để hiệu chỉnh lại tần suất ping giữ warm nếu cần |
| Supabase outage/mất region | Restore pg_dump mới nhất ra Supabase project region khác / Neon; đổi env; RTO mục tiêu 4h (đo bằng diễn tập thật) |
| Xóa nhầm dữ liệu (DELETE thiếu WHERE) | pg_dump gần nhất (tối đa 4–6h cũ) + dựng lại phần chênh từ audit_logs & stock_movements (sổ cái cho phép replay một phần) |
| Lộ service-role key | Rotate key trong Supabase dashboard TỨC THÌ (bước 1 RUNBOOK), redeploy, rà audit xem key bị dùng làm gì |
| Domain/DNS bị chiếm | Registrar lock + 2FA từ ngày mua; recovery qua registrar |
| Bill tăng bất thường | Usage cap + alert 80%; rate limit là phòng tuyến 1 |

**Hiệu năng chủ động**: Lighthouse CI (mobile, PDP + listing + home) là gate CI từ M5, budget: Perf ≥ 90, LCP < 2,5s, CLS < 0,1, JS < 170KB; k6 smoke 100 đơn/giờ trước mở bán; slow query log Supabase bật, review tuần.

**Tests**: health check trả sai khi DB down (test bằng cách trỏ env sai ở staging); restore drill có biên bản; alert giả (kéo dead-letter > 0) → nhận được email thật.

**Câu hỏi trước khi code**: RPO khác RTO thế nào, con số hiện tại của bạn là gì và bạn chấp nhận không (mất 6h đơn = ~7 đơn — chấp nhận được chứ)? Vì sao backup phải nằm ngoài Supabase? Vì sao "0 đơn trong 24h" là alert quan trọng nhất danh sách?

---

# PHẦN 3 — BẢNG THREAT MODEL TỔNG (toàn hệ thống)

| Tài sản | Đe dọa (STRIDE) | Kịch bản cụ thể | Kiểm soát chính | Module | Rủi ro còn lại |
|---|---|---|---|---|---|
| Quyền admin | Spoofing/Elevation | đoán password, phishing, staff leo quyền | TOTP bắt buộc, lockout, requireRole từng action, is_active mỗi request | M02 | Phishing TOTP realtime (thấp, chấp nhận) |
| Tiền của đơn | Tampering | giả IPN, sửa amount, replay | HMAC verify trên raw, so amount với DB, webhook_events idempotent, returnURL không tin | M08 | Lỗi logic mới khi thêm cổng (giảm bằng test vector) |
| Giá bán | Tampering | client gửi giá, admin sửa lén | server-side pricing, snapshot, trigger audit | M05/M06/M10 | Thấp |
| Tồn kho | Tampering/DoS | oversell race, đơn rác giam hàng | atomic update, ledger, auto-release, Turnstile | M04/M06 | Flash-sale contention (chưa tới) |
| PII khách | Info disclosure | dò tra cứu đơn/phiếu, RLS hở, log lộ | code random + match SĐT + rate limit, RLS test tự động, Sentry scrub | M07/M09/M14 | Supabase nước ngoài — vấn đề pháp lý hơn kỹ thuật (D5) |
| Storage | Tampering/XSS | polyglot upload, SVG, đoán URL private | magic bytes, re-encode, cấm SVG, quarantine, signed URL | M13 | Thấp |
| Coupon/KM | Abuse | brute-force mã, farm lượt bằng nhiều SĐT | atomic lượt, rate limit, per-phone limit | M05 | Đổi SĐT vượt limit (chấp nhận MVP) |
| Availability | DoS | bot cày search/checkout đốt quota | rate limit, Turnstile, usage cap + alert | M01/M15 | DDoS lớp lớn → nấp sau Cloudflare (khi cần) |
| Dữ liệu tổng thể | Destruction | xóa nhầm, ransomware chuỗi cung ứng npm | pg_dump 4–6h/lần offsite + backup ảnh tuần + restore drill hằng tháng, Dependabot + lockfile + audit CI (không còn lớp Supabase Pro daily — xem 0.5.2) | M15 | **RPO 4–6h thay vì gần-0** — rủi ro đã được bạn chấp nhận tường minh khi chọn giữ Supabase Free (0.3/D2) |
| Availability (project pause) | DoS/Availability | Supabase Free tự pause sau 7 ngày không request; usage chạm trần free tier | uptime ping giữ warm, alert kết nối DB fail 3 lần liên tiếp, alert usage 80% | M15 | Rủi ro đặc thù của quyết định giữ Free — không loại bỏ được hoàn toàn, chỉ giảm thời gian phát hiện (0.5.1) |
| Uy tín pháp lý | Compliance | thiếu BCT, sai luật DLCN, sai HĐĐT | bảng nghĩa vụ M14 + xác minh chuyên gia (D5) | M14 | Luật mới thay đổi — review 6 tháng/lần |

---

# PHẦN 4 — TRADE-OFFS KIẾN TRÚC (nói đơn giản → nói kỹ thuật)

**T1. Monolith thay vì microservices.** *Đơn giản:* một căn nhà dễ dọn hơn mười căn hộ rải khắp thành phố, khi bạn chỉ có một mình. *Kỹ thuật:* microservices đổi độ phức tạp trong-process lấy độ phức tạp mạng (retry, saga, distributed tracing) — chi phí đó chỉ đáng khi nhiều team đụng nhau. Modular monolith giữ ranh giới bằng thư mục + quy tắc "không import bảng của module khác", giữ nguyên đường tách service sau này.

**T2. Trừ kho ngay thay vì reservation 2 pha.** *Đơn giản:* cầm hàng ra quầy tính tiền luôn, thay vì dán giấy "đã có người giữ". *Kỹ thuật:* reservation (cột reserved + TTL + đối chiếu) là mô hình đúng ở quy mô lớn nhưng thêm 1 trạng thái phải đồng bộ; ở 30 đơn/ngày, trừ ngay + auto-release 60' cho kết quả tương đương với 1/3 số khái niệm. Điểm nâng cấp đã đánh dấu ở M04.

**T3. Postgres FTS thay vì Meilisearch.** *Đơn giản:* chưa cần thuê thủ thư riêng cho tủ sách 1.000 cuốn. *Kỹ thuật:* thêm search engine = thêm đồng bộ hai chiều, thêm failure mode, thêm tiền — trong khi GIN + unaccent + trgm đáp ứng < 100ms ở 10³–10⁴ documents. Ngưỡng chuyển: 10⁴ SKU hoặc cần facet count phức tạp.

**T4. Jobs-table thay vì Redis/BullMQ/Kafka.** *Đơn giản:* danh sách việc dán tủ lạnh đủ cho gia đình; chưa cần phần mềm quản lý công việc của tập đoàn. *Kỹ thuật:* `FOR UPDATE SKIP LOCKED` cho at-least-once queue ngay trong DB đã có transaction chung với nghiệp vụ (gần-outbox miễn phí); mất: pub/sub realtime, throughput — chưa cần cả hai.

**T5. Guest checkout thay vì bắt tạo tài khoản.** *Đơn giản:* đừng bắt khách điền đơn xin việc để mua chai nước. *Kỹ thuật:* mỗi bước thêm ở checkout rụng khách; định danh mềm theo SĐT + tra cứu mã đơn phủ 90% nhu cầu "tài khoản"; trade-off thật: lịch sử đơn gom yếu, wishlist không có — Phase 1.5 vá khi có nhu cầu thật.

**T6. Đối soát VietQR thủ công trước, tự động sau.** *Đơn giản:* tuần đầu tự soát sao kê 10 phút/ngày để hiểu tiền chảy thế nào, rồi hãy mua máy đếm tiền. *Kỹ thuật:* SePay/Casso webhook là dependency + phí + bề mặt tấn công mới; làm tay giai đoạn đầu còn giúp bạn thiết kế đúng màn đối soát tự động Phase 2 (vì đã hiểu edge case thật).

**T7. RLS là lưới an toàn, không phải cơ chế phân quyền chính.** *Đơn giản:* cửa chính có bảo vệ (server check quyền); RLS là khóa từng phòng phòng khi bảo vệ ngủ gật. *Kỹ thuật:* logic quyền phức tạp (ma trận role, ngữ cảnh nghiệp vụ) diễn đạt trong TypeScript dễ test hơn trong policy SQL; RLS giữ vai trò chặn recovery khi có bug ở tầng app — defense in depth, mỗi tầng đơn giản.

**T8. ISR thay vì SSR mọi request.** *Đơn giản:* in sẵn tờ rơi mỗi phút một lần thay vì viết tay cho từng khách. *Kỹ thuật:* trade staleness ≤ 60s của giá/tồn kho hiển thị lấy TTFB < 100ms + chịu tải bot; chốt chống sai: checkout luôn re-validate — hiển thị có thể cũ 60 giây, HÓA ĐƠN thì không bao giờ.

**T9. Vercel + Supabase thay vì VPS tự quản.** *Đơn giản:* thuê căn hộ có bảo vệ và sửa ống nước, thay vì mua đất tự xây tự trực đêm. *Kỹ thuật:* VPS rẻ hơn tiền mặt (~200–400k) nhưng bạn thành người vá OS, cấu hình nginx/TLS, HA, backup — chi phí thật tính bằng đêm mất ngủ của người duy nhất trong team. Trade-off chấp nhận: vendor lock-in mềm + dữ liệu ở Singapore (→ nghĩa vụ pháp lý D5, R5).

**T10. Supabase Free (kể cả production) thay vì Pro — trade-off tiền bạc đổi bằng quy trình.** *Đơn giản:* thay vì trả tiền thuê người trực đêm canh dữ liệu (Pro's daily backup + PITR), bạn tự đặt đồng hồ báo thức và tự sao lưu tay đều đặn hơn — rẻ hơn nhưng đòi kỷ luật vận hành cao hơn. *Kỹ thuật:* Pro mua sẵn RPO gần-0 (PITR) + daily backup do nhà cung cấp quản lý + không có rủi ro auto-pause; Free đổi lại 0đ/tháng lấy RPO 4–6h tự làm bằng pg_dump + rủi ro pause phải tự canh bằng uptime ping/alert. Ở quy mô < 30 đơn/ngày, "giá" của rủi ro này (vài đơn phải nhập tay lại nếu rơi đúng tình huống xấu nhất) nhỏ hơn 25$/tháng nhân với thời gian MVP — đây là lý do quyết định hợp lý, miễn là kỷ luật restore-drill hằng tháng được giữ nghiêm (0.5.2). Điểm gãy: nếu quy mô đơn/ngày tăng đáng kể, "giá" rủi ro tăng theo trong khi chi phí Pro không đổi — đó là lúc tự đánh giá lại, không phải quyết định một lần cho mãi mãi.

**T10. Cắt MoMo khỏi MVP (chờ duyệt D4).** *Đơn giản:* mở quán với 2 cách nhận tiền chạy ngon hơn là 4 cách chạy tập tễnh. *Kỹ thuật:* mỗi PSP = hợp đồng + sandbox + bảng mã lỗi + luồng đối soát + luồng refund riêng; COD+VietQR phủ đại đa số hành vi thanh toán VN hiện tại, VNPay phủ thẻ; adapter interface làm chi phí thêm-sau ≈ chi phí thêm-ngay, nên trì hoãn là miễn phí về mặt kiến trúc.

---

# PHẦN 5 — GLOSSARY (thuật ngữ dùng trong tài liệu)

| Thuật ngữ | Nghĩa trong dự án này |
|---|---|
| SKU / Variant | Đơn vị bán cụ thể (iPhone 15 Pro Max **256GB Titan**); product là nhóm, variant là thứ nằm trong kho |
| RSC | React Server Component — component render trên server, không gửi JS xuống client |
| ISR | Incremental Static Regeneration — trang tĩnh tự làm mới theo chu kỳ/theo lệnh (`revalidateTag`) |
| RLS | Row Level Security — Postgres lọc từng dòng theo policy, áp cả khi code app có bug |
| anon key / service-role key | Khóa Supabase công khai (bị RLS ràng) / khóa server toàn quyền (bỏ qua RLS — tuyệt mật) |
| Server Action | Hàm chạy server được gọi từ form/React — thay REST nội bộ trong Next.js |
| IPN / webhook | Cổng thanh toán chủ động gọi server ta để báo kết quả — nguồn sự thật duy nhất về "đã trả tiền" |
| HMAC | Chữ ký dựa trên secret chung — chứng minh message từ đúng người gửi, không bị sửa |
| Idempotency | Chạy 1 lần hay N lần cùng input → kết quả như nhau (chống double-submit, webhook retry) |
| Ledger (sổ cái) | Bảng append-only ghi mọi biến động (+/−); số dư = tổng — cho phép truy vết và dựng lại |
| State machine | Danh sách trạng thái + bảng chuyển hợp lệ; mọi thay đổi ngoài bảng = bug |
| Snapshot | Chụp giá trị tại thời điểm giao dịch (giá trong order_items) — quá khứ không đổi khi hiện tại đổi |
| AAL1 / AAL2 | Mức đảm bảo xác thực: mật khẩu / mật khẩu + TOTP |
| TOTP | Mã 6 số 30 giây từ app authenticator |
| Turnstile | CAPTCHA ẩn của Cloudflare, chống bot form công khai |
| Presigned URL | URL tạm cho phép upload/download thẳng storage không lộ khóa |
| Magic bytes | Vài byte đầu file tiết lộ loại thật — tin nó, đừng tin đuôi file |
| EMVCo QR / VietQR | Chuẩn QR chuyển khoản ngân hàng VN — sinh offline được, không cần API |
| FTS / tsvector / GIN | Full-text search Postgres / cột từ-đã-phân-tích / loại index cho tập hợp |
| pg_trgm | So khớp mờ theo bộ 3 ký tự — bắt sai chính tả |
| unaccent | Bỏ dấu tiếng Việt để "dien thoai" khớp "điện thoại" |
| FOR UPDATE SKIP LOCKED | Khóa dòng đang lấy, bỏ qua dòng người khác khóa — nền của job queue trong DB |
| Expand → Migrate → Contract | Đổi schema 3 bước để code cũ/mới sống chung — không bao giờ DROP ngay |
| RPO / RTO | Mất tối đa bao nhiêu dữ liệu / mất bao lâu để chạy lại |
| SLO | Cam kết chất lượng đo được (99,5% uptime) |
| Dead-letter | Job fail quá số lần cho phép — dừng, chờ người xử lý |
| COD | Thu tiền khi giao hàng |
| GPKD / MST | Giấy phép kinh doanh / mã số thuế |
| BCT / online.gov.vn | Bộ Công Thương / cổng thông báo website TMĐT |
| NĐ 13/2023, Luật BVDLCN 2025 | Khung pháp lý bảo vệ dữ liệu cá nhân VN |
| HĐĐT | Hóa đơn điện tử |
| PSP | Payment Service Provider — VNPay, MoMo… |

---

# PHẦN 6 — CHECKLIST "SẴN SÀNG IMPLEMENT"

**Phê duyệt & pháp lý**
- [x] D1–D6 đã chốt qua Decision Review 31/07/2026 (biên bản ở mục 0.3)
- [x] **D2/D3 đã sửa lại (07/2026)**: Supabase Free cho cả dev+production; ngân sách vận hành **< 1 triệu/tháng**
- [x] Phạm vi thanh toán MVP chốt: COD + VietQR → VNPay; MoMo Phase 2 (D4)
- [ ] Lịch hẹn xác minh pháp lý (D5 đã duyệt chi) — đặt trong M1–M2, chặn MỞ BÁN
- [x] A1 (GPKD: **đã có**), A2 (phí ship: **cố định 2 vùng**) đã xác nhận
- [x] Risk register Supabase Free (0.5.1) + phương án giảm thiểu (0.5.2) đã ghi vào plan
- [ ] **Ràng buộc "cấm agent tự nâng cấp/đề nghị Supabase Pro" (0.5) phải chép vào `CLAUDE.md` ở M0b**

**Tài khoản & hạ tầng cần tạo ở M0b (theo thứ tự — KHÔNG tạo bất kỳ cái nào trong M0a)**
- [ ] GitHub repo (private) · [ ] Supabase project (**Free tier**, region Singapore) · [ ] Vercel project + domain
- [ ] Cloudflare (DNS + Turnstile) · [ ] Resend + SPF/DKIM/DMARC · [ ] Upstash · [ ] Sentry · [ ] BetterStack
- [ ] GitHub Actions cron cho pg_dump (4–6h/lần) + rclone storage backup (tuần) → R2/B2 — thiết lập cùng đợt với repo, không phải "để sau"
- [ ] GA4 + Search Console · [ ] R2/B2 bucket backup · [ ] Registrar lock + 2FA mọi tài khoản trên

**Tài liệu (M0a viết docs/modules/*; các file còn lại viết ở M0b)**
- [ ] docs/modules/M01.md → M15.md + docs/modules/INDEX.md (bảng trạng thái duyệt) — sản phẩm của M0a
- [ ] CLAUDE.md (invariants M01 + lệnh + điều cấm) · [ ] docs/PRD.md · [ ] docs/ARCHITECTURE.md
- [ ] docs/DATA-MODEL.md · [ ] docs/SECURITY.md · [ ] docs/PAYMENTS.md · [ ] docs/UX-GUIDELINES.md
- [ ] docs/SEO-PERFORMANCE.md · [ ] docs/ROADMAP.md · [ ] docs/TESTING.md · [ ] docs/RUNBOOK.md
- [ ] docs/DECISIONS-PENDING.md (bảng 0.2 + 0.3) · [ ] docs/adr/ADR-001 (stack) …

**Definition of Done cho MỌI milestone**
- [ ] Test của milestone xanh trong CI (unit + integration + e2e liệt kê trong module specs)
- [ ] Security items của module liên quan tick trong SECURITY.md
- [ ] Audit log phủ hành động admin mới thêm
- [ ] Có đường rollback ghi trong RUNBOOK (flag/revert)
- [ ] Docs cập nhật cùng PR (không có "sẽ viết sau")

**Gate trước khi MỞ BÁN THẬT (cuối M2)**
- [ ] Supabase Free (giữ nguyên, không nâng — quyết định 0.3/D2) + pg_dump 4–6h/lần đã chạy ổn định ≥ 1 tuần + rclone backup ảnh đã chạy + **đã restore thử thành công ít nhất 1 lần trước ngày mở bán**
- [ ] Thông báo BCT đã nộp · [ ] Chính sách + consent + cookie banner sống
- [ ] Race tests (kho, coupon, slot) xanh · [ ] Tamper test giá xanh · [ ] RLS test xanh
- [ ] 3 hành trình thật trên điện thoại thật: mua COD, mua VietQR, đặt lịch sửa
- [ ] Alert "0 đơn trong 24h" + uptime + Sentry đã bắn thử thành công

---

## Milestone M0a — "Architecture Learning Pack" (MỚI — bổ sung theo yêu cầu 31/07/2026)

**Phạm vi cứng**: CHỈ tạo tài liệu học và sơ đồ. **Không code, không cài package, không tạo database, không tạo tài khoản dịch vụ ngoài.** Ước lượng: S–M (3–7 ngày viết + thời gian bạn đọc/duyệt từng file).

**Sản phẩm**: `docs/modules/M01.md` → `M15.md` (một file cho mỗi module ở Phần 2) + `docs/modules/INDEX.md` (bảng trạng thái duyệt). Mỗi file M##.md bắt buộc đủ **11 mục**:

1. Mục đích nghiệp vụ
2. Người dùng
3. Dữ liệu (bảng, quan hệ, ràng buộc, index)
4. Luồng xử lý (kèm sơ đồ mermaid/ASCII)
5. Quy tắc bất biến
6. Bảo mật (threat model + kiểm soát)
7. Hiệu năng
8. **Lỗi thường gặp khi implement** (mục mới so với Phần 2 — các bẫy kinh điển của chính module đó)
9. Test (unit / integration / e2e / security)
10. Scale trigger
11. Câu hỏi tự kiểm tra (bạn trả lời được hết mới coi là đã hiểu module)

Nguồn nội dung: Phần 2 của tài liệu này, viết lại theo hướng giáo trình, bổ sung sơ đồ và mục "lỗi thường gặp".

**Acceptance criteria**: bạn đọc và **duyệt từng file một** — file được duyệt đánh dấu ✅ kèm ngày trong `INDEX.md`; file chưa duyệt = module đó chưa được phép code.

**Gate cứng**: M0b (scaffolding, cài package, tạo Supabase project, tạo tài khoản) **chỉ bắt đầu sau khi toàn bộ 15 file được duyệt**.

**Rollback**: chỉ là tài liệu — viết lại tự do, không có rủi ro hệ thống.

---

**Roadmap (đã điều chỉnh theo Decision Review + M0a)**: **M0a Architecture Learning Pack (S–M, chỉ docs, gate duyệt từng module)** → M0b Nền móng (S) → M1 Catalog+Media+Search (L) → M2 Cart/Checkout/COD+VietQR/Orders 🚀 (L) → M3 VNPay (M) → M4 Repairs (M, song song M3) → M5 Coupon+SEO+Hardening (M) → Phase 2: MoMo, SePay, GHN API, tài khoản khách, quote sửa chữa, reviews, ZNS, HĐĐT.

---

## Verification khi implement (giữ nguyên hiệu lực)

1. Mỗi milestone chạy đủ bộ test mô tả trong spec module tương ứng; CI xanh mới merge.
2. Gate mở bán = checklist Phần 6 mục cuối, tick từng dòng có bằng chứng (link CI run, ảnh chụp, biên bản restore).
3. Security gate M5: chạy lại toàn bộ threat model Phần 3 như checklist tấn công thử (curl tamper giá, replay IPN, RLS anon, upload polyglot).
4. Perf gate: Lighthouse CI mobile ≥ 90 (home, listing, PDP); funnel GA4 đủ event trên production.

---

**WAITING FOR APPROVAL**
