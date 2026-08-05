# Từ điển thuật ngữ dự án Điện Tử Hưng Phát

Tài liệu này giải thích những khái niệm sẽ gặp trong `PLAN.md`, tài liệu module và mã nguồn. Mục tiêu là hiểu đúng bản chất, không học thuộc định nghĩa.

## Cách sử dụng

- **Mức A — phải hiểu ngay**: nền tảng để đọc M01 và hiểu website hoạt động thế nào.
- **Mức B — hiểu trước module liên quan**: chưa cần nhớ hôm nay; tra lại khi học module đó.
- **Mức C — nhận diện**: biết nó dùng để giải quyết chuyện gì; chưa cần biết cách triển khai.

Mỗi thuật ngữ nên được học bằng ba câu: nó là gì, dùng để làm gì, làm sai gây chuyện gì.

---

## 1. Bức tranh cơ bản của một website

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Client | Phần chạy ở phía người dùng, thường là trình duyệt. Client hiển thị giao diện và gửi ý định; không được quyết định giá, tồn kho hay quyền admin. |
| A | Browser / trình duyệt | Chrome, Edge, Safari… tải HTML/CSS/JavaScript, giữ cookie và gửi request tới server. |
| A | Server | Máy/chương trình nhận request, kiểm tra quyền, chạy nghiệp vụ và làm việc với database. Với dự án này, phần lớn server code nằm trong Next.js trên Vercel. |
| A | Frontend | Phần khách nhìn và thao tác: trang chủ, sản phẩm, giỏ hàng, checkout, admin UI. |
| A | Backend | Phần xử lý phía server: tính tiền, trừ kho, tạo đơn, xác minh thanh toán, phân quyền. Next.js cho phép frontend và backend sống trong cùng ứng dụng nhưng vẫn phải tách trách nhiệm. |
| A | Database / cơ sở dữ liệu | Nơi lưu dữ liệu có cấu trúc: sản phẩm, SKU, kho, đơn, thanh toán, phiếu sửa chữa. Dự án dùng PostgreSQL qua Supabase. |
| A | Request | Một yêu cầu gửi tới server, ví dụ “mở sản phẩm A” hoặc “đặt mua 2 cái”. |
| A | Response | Câu trả lời của server: HTML, JSON, ảnh, hoặc mã lỗi. |
| A | API | Giao diện để hai phần mềm nói chuyện theo quy ước. Ví dụ trình duyệt gọi API tra cứu đơn, VNPay gọi webhook của website. |
| A | URL | Địa chỉ của một tài nguyên, ví dụ `/san-pham/tivi-sony` hoặc `/api/webhooks/vnpay`. |
| A | Route | Quy tắc ánh xạ một URL tới trang hoặc hàm xử lý. |
| A | Domain name / tên miền | Tên dễ nhớ trỏ tới website, ví dụ `dientuhungphat.vn`. |
| B | DNS | “Danh bạ Internet” đổi tên miền thành địa chỉ hạ tầng phục vụ website. DNS sai thì khách không vào web dù code vẫn tốt. |
| A | HTTP | Bộ quy tắc request/response của web. GET thường để đọc; POST thường để tạo/gửi dữ liệu. |
| A | HTTPS / TLS | HTTP có mã hóa và xác thực máy chủ. Bảo vệ mật khẩu, cookie và dữ liệu khách trên đường truyền. |
| B | Header | Metadata đi kèm request/response, ví dụ loại nội dung, cookie, chữ ký webhook, cache policy. |
| B | Body | Phần dữ liệu chính của request/response, ví dụ form checkout hoặc JSON webhook. |
| A | Status code | Mã kết quả HTTP: 2xx thành công, 4xx yêu cầu/quyền không hợp lệ, 5xx lỗi hệ thống. Không nên dùng tất cả lỗi thành 200. |
| A | Cookie | Mẩu dữ liệu nhỏ trình duyệt tự gửi về đúng website. Dùng cho session/giỏ hàng; cần `HttpOnly`, `Secure`, `SameSite` phù hợp. |
| A | Session | Trạng thái đăng nhập/phiên làm việc được server xác nhận. Cookie thường giữ mã tham chiếu hoặc token của session. |
| B | Same-origin | Hai tài nguyên cùng scheme + host + port. Đây là ranh giới quan trọng để trình duyệt hạn chế website khác đọc/gọi dữ liệu của ta. |
| B | CORS | Chính sách server cho phép origin nào gọi API từ trình duyệt. CORS không phải cơ chế đăng nhập hay chống mọi cuộc tấn công. |

### Ví dụ ngắn

Khách mở trang TV: browser gửi HTTP request tới URL sản phẩm → server đọc database hoặc cache → trả HTML response → browser hiển thị frontend.

---

## 2. React và Next.js

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | React | Thư viện xây giao diện từ các component. React không tự quyết kiến trúc backend hoặc bảo mật dữ liệu. |
| A | Component | Một khối giao diện có trách nhiệm rõ, ví dụ `ProductCard`, `Price`, `AddToCartButton`. |
| A | Props | Dữ liệu cha truyền cho component con. Props từ client không bao giờ được xem là dữ liệu đáng tin cho nghiệp vụ. |
| B | State | Dữ liệu tạm thay đổi trong giao diện, ví dụ biến thể đang chọn hoặc trạng thái mở menu. Không phải nguồn sự thật của đơn hàng. |
| A | Next.js | Framework dựa trên React, cung cấp routing, render server, xử lý request, cache và build/deploy ứng dụng. |
| A | App Router | Cơ chế routing theo thư mục `app/` của Next.js: page, layout, loading, error và route handler. |
| A | Server Component / RSC | Component chạy trên server, có thể đọc dữ liệu server và gửi kết quả render xuống; không gửi toàn bộ code component xuống browser. Phù hợp cho trang sản phẩm/SEO. |
| A | Client Component | Component chạy tương tác trong browser, khai báo `use client`; dùng cho nút bấm, form tương tác, gallery. Dùng quá nhiều làm bundle nặng. |
| B | Hydration | React gắn logic tương tác vào HTML đã render. Hydration mismatch xảy ra khi HTML server và client không khớp. |
| A | Server Action | Hàm chạy trên server được gọi từ form/component. Nó vẫn là ranh giới công khai: phải kiểm quyền, validate input và gọi service. |
| A | Route Handler | Hàm xử lý HTTP trong `route.ts`, phù hợp cho webhook, API, cron hoặc endpoint cần kiểm soát request/response trực tiếp. |
| A | Layout | Khung giao diện dùng chung cho một nhóm route, ví dụ header/footer storefront hoặc menu admin. |
| B | Middleware / Proxy | Lớp chạy trước route để xử lý việc phù hợp như redirect hoặc kiểm tra sơ bộ. Không nên nhét toàn bộ business rule vào đây. |
| A | SSR | Server-Side Rendering: tạo HTML trên server cho request. Nội dung mới nhưng tốn xử lý mỗi lượt nếu không cache. |
| B | SSG | Static Site Generation: tạo HTML lúc build. Rất nhanh nhưng dữ liệu thay đổi cần build lại. |
| A | ISR | Incremental Static Regeneration: phục vụ trang đã tạo và làm mới theo thời gian/theo tín hiệu. Hợp với catalog đọc nhiều, sửa ít. |
| A | Cache | Bản sao dữ liệu/kết quả để trả nhanh hơn. Cache có thể cũ nên checkout phải xác minh dữ liệu nguồn. |
| A | Cache invalidation | Làm bản cache hết hiệu lực khi dữ liệu đổi. Đây là việc khó vì xóa thiếu gây dữ liệu cũ, xóa quá rộng làm chậm hệ thống. |
| B | `revalidateTag` | Cách Next.js làm mới các dữ liệu/trang mang một tag, ví dụ admin sửa sản phẩm thì revalidate `product:{id}`. |
| B | Bundle | Tập JavaScript/CSS gửi xuống browser. Bundle càng lớn, điện thoại yếu và mạng chậm càng lâu tương tác được. |
| B | Environment variable | Cấu hình ngoài code như URL database, API key. Secret env chỉ được đọc phía server và không commit vào Git. |

---

## 3. Kiến trúc phần mềm

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Architecture / kiến trúc | Cách chia trách nhiệm, dữ liệu và quan hệ phụ thuộc của hệ thống. Không chỉ là sơ đồ công nghệ. |
| A | Module | Một vùng nghiệp vụ có trách nhiệm và dữ liệu rõ, như Catalog, Inventory, Orders, Payments. |
| A | Boundary / ranh giới | Quy định module sở hữu gì và được giao tiếp với module khác qua đâu. Ranh giới tốt ngăn sửa Payments làm hỏng Catalog. |
| A | Business rule | Quy tắc kinh doanh, ví dụ “không cho tồn kho âm”, “return URL không đánh dấu đã trả tiền”. |
| A | Domain | Lĩnh vực nghiệp vụ mà phần mềm mô hình hóa. Ở đây là bán lẻ đa ngành và sửa chữa điện tử. |
| B | Domain model | Cách biểu diễn khái niệm và quy tắc nghiệp vụ bằng code: Order, Money, StockMovement, trạng thái hợp lệ. |
| A | Service / use case | Hàm/lớp điều phối một hành động nghiệp vụ hoàn chỉnh như `createOrder`; kiểm invariant, dùng repository/port và quản lý transaction. |
| A | Invariant / bất biến | Điều luôn phải đúng, bất kể luồng nào gọi. Ví dụ số lượng kho không âm và đơn paid phải có payment hợp lệ. |
| A | Dependency | Thành phần A cần B để hoạt động. Quản lý hướng dependency giúp business logic không bị khóa vào framework/vendor. |
| A | Dependency rule | Phần bên trong không biết chi tiết bên ngoài: nghiệp vụ không import React, Supabase SDK hoặc VNPay SDK. |
| B | Clean Architecture | Kiến trúc tách entity/use case khỏi UI, database và framework; dependency hướng vào logic cốt lõi. |
| B | Hexagonal Architecture | Kiến trúc “ports and adapters”: core nêu nhu cầu qua interface; adapter kết nối PostgreSQL, email hoặc payment. |
| B | Port | Interface do core định nghĩa, ví dụ `OrderRepository` hoặc `PaymentGateway`; mô tả cần gì, không nói vendor làm ra sao. |
| B | Adapter | Cài đặt port cho công nghệ cụ thể, ví dụ `PostgresOrderRepository`, `VnPayAdapter`. |
| B | Repository | Abstraction đọc/ghi domain data. Không nên trở thành túi hàm SQL vô tổ chức. |
| B | Entity | Đối tượng có định danh bền theo thời gian, ví dụ Order có `id` dù trạng thái thay đổi. |
| B | Value Object | Giá trị được nhận diện bằng nội dung, thường bất biến, ví dụ Money hoặc PhoneNumber đã chuẩn hóa. |
| B | Aggregate | Ranh giới nhất quán; mọi thay đổi đi qua aggregate root để invariant không bị phá. |
| C | Bounded Context | Biên ngữ nghĩa của một model. “Customer” trong Orders có thể chỉ là snapshot giao hàng, khác hồ sơ trong Identity. |
| C | Anti-Corruption Layer | Lớp dịch giữa hai context/vendor để model bên ngoài không làm bẩn model nội bộ. Payment adapter là ví dụ. |
| A | Modular monolith | Một ứng dụng/deploy/database nhưng code chia module rõ. Phù hợp một người vận hành, vẫn có đường tách sau. |
| C | Microservice | Module chạy thành dịch vụ/deploy riêng, giao tiếp qua mạng. Thêm retry, quan sát phân tán và vận hành; chưa cần cho MVP này. |
| B | DTO | Cấu trúc dữ liệu đi qua ranh giới, ví dụ input checkout. DTO không nhất thiết là domain entity. |
| A | Schema validation | Kiểm tra dữ liệu có đúng hình dạng/giới hạn trước khi vào nghiệp vụ. Dự án dự kiến dùng Zod. |
| A | Error code | Mã lỗi ổn định như `OUT_OF_STOCK`; UI dịch mã thành thông báo, log dùng mã để theo dõi. |
| B | Idempotency | Thực hiện lại cùng yêu cầu không tạo tác dụng phụ lần hai. Cực quan trọng cho webhook, job retry và double-click checkout. |
| A | State machine | Danh sách trạng thái và chuyển đổi hợp lệ. Ví dụ đơn không được nhảy từ `cancelled` sang `shipped`. |

---

## 4. PostgreSQL và dữ liệu

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | PostgreSQL / Postgres | Hệ quản trị cơ sở dữ liệu quan hệ dùng trong Supabase. |
| A | Table | Bảng chứa một loại bản ghi, ví dụ `products`, `orders`. |
| A | Row / record | Một bản ghi trong bảng, ví dụ một đơn hàng. |
| A | Column | Một thuộc tính của bản ghi, ví dụ `status`, `created_at`. |
| A | Schema | Có hai nghĩa: cấu trúc dữ liệu/database namespace, hoặc bộ quy tắc validate input. Phải nhìn ngữ cảnh. |
| A | Primary key / PK | Định danh duy nhất của row, thường là UUID `id`. |
| A | Foreign key / FK | Liên kết có kiểm soát giữa bảng, ví dụ `order_items.order_id` trỏ `orders.id`. |
| A | Constraint | Luật do database bảo vệ: NOT NULL, UNIQUE, CHECK, FK. Đây là phòng tuyến cuối khi app có bug. |
| B | Index | Cấu trúc giúp tìm/sắp xếp nhanh hơn, đổi lại tốn dung lượng và làm ghi chậm hơn. Không thêm index theo cảm tính. |
| B | B-tree index | Index mặc định tốt cho bằng, khoảng và sắp xếp, ví dụ `created_at`, `price`. |
| C | GIN index | Index cho dữ liệu tập hợp/text search/JSONB, dùng cho tìm kiếm catalog. |
| A | Query | Câu lệnh đọc/thay đổi dữ liệu. Query đúng nhưng thiếu giới hạn/index vẫn có thể làm hệ thống chậm. |
| A | SQL | Ngôn ngữ làm việc với database quan hệ. ORM không loại bỏ nhu cầu hiểu SQL. |
| B | ORM | Công cụ ánh xạ code với SQL/database. Dự kiến dùng Drizzle để schema/query có type và migration rõ. |
| A | Transaction | Nhóm thao tác cùng commit hoặc cùng rollback. Dùng để tạo đơn + item + trừ kho nguyên tử. |
| A | Commit | Xác nhận transaction thành công và thay đổi trở nên chính thức. |
| A | Rollback | Hủy toàn bộ thay đổi chưa commit khi có lỗi. |
| B | ACID | Bốn tính chất transaction: nguyên tử, nhất quán, cô lập, bền vững. Cần hiểu ý nghĩa, không cần học thuộc chữ viết tắt. |
| B | Isolation level | Mức độ các transaction đồng thời nhìn/ảnh hưởng nhau. Chọn sai có thể oversell dù đã dùng transaction. |
| A | Race condition | Kết quả phụ thuộc thời điểm hai thao tác chạy đồng thời, ví dụ hai khách cùng mua món cuối. |
| B | Row lock | Khóa row trong transaction để thao tác cạnh tranh không sửa cùng lúc ngoài kiểm soát. |
| B | `FOR UPDATE` | Đọc row và khóa để chuẩn bị cập nhật an toàn. |
| C | `SKIP LOCKED` | Bỏ qua row đang bị worker khác khóa; hữu ích cho nhiều worker claim job. |
| B | Deadlock | Hai transaction giữ khóa và chờ nhau. Database hủy một bên; app phải retry an toàn. |
| A | Migration | File thay đổi schema có phiên bản, review được và chạy theo thứ tự. Không sửa production bằng tay rồi quên ghi lại. |
| B | Expand → Migrate → Contract | Đổi schema an toàn: thêm cấu trúc tương thích → chuyển dữ liệu/code → sau cùng xóa cấu trúc cũ. |
| A | UUID | ID gần như duy nhất toàn cục, khó đoán hơn số tăng dần nhưng vẫn không thay thế phân quyền. |
| A | `bigint` VND | Lưu tiền bằng số nguyên đồng, tránh sai số số thực. Ví dụ 1.299.000đ lưu `1299000`. |
| B | `timestamptz` | Thời điểm có timezone trong Postgres; lưu UTC, hiển thị `Asia/Ho_Chi_Minh`. |
| B | JSONB | JSON lưu trong Postgres có thể query/index; hợp thông số linh hoạt nhưng không nên nhét mọi thứ vào một cột. |
| B | Snapshot | Chụp dữ liệu tại thời điểm giao dịch. Giá/tên trong order item không đổi khi sản phẩm hiện tại đổi. |
| B | Ledger | Sổ cái append-only ghi từng biến động; tồn kho có thể đối chiếu từ tổng movement thay vì chỉ tin một con số. |
| B | Append-only | Chỉ thêm sự kiện mới, hạn chế sửa/xóa lịch sử. Nếu điều chỉnh thì thêm bản ghi bù. |
| B | Pagination | Chia danh sách thành trang/cursor để không tải hàng nghìn row một lần. |
| C | Connection pool | Tái sử dụng kết nối DB và giới hạn số kết nối; quan trọng với serverless. |
| C | FTS / Full-Text Search | Tìm theo từ/ngôn ngữ thay vì `%chuỗi%` đơn giản. Dùng cho catalog khi quy mô phù hợp. |
| C | `tsvector` | Biểu diễn văn bản đã chuẩn bị cho Postgres FTS. |
| C | `pg_trgm` | Extension so khớp theo cụm ba ký tự, hỗ trợ tìm gần đúng/sai chính tả. |
| C | `unaccent` | Extension bỏ dấu để `dien thoai` có thể khớp `điện thoại`. |

---

## 5. Xác thực, phân quyền và bảo mật

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Authentication / AuthN | Xác minh “bạn là ai”, ví dụ đăng nhập đúng tài khoản admin. |
| A | Authorization / AuthZ | Kiểm tra “bạn được làm gì”, ví dụ staff được xử lý đơn nhưng không xem giá vốn. |
| A | RBAC | Phân quyền theo vai trò như `owner`, `staff`. Mỗi action nhạy cảm phải kiểm quyền phía server. |
| A | Least privilege | Chỉ cấp quyền tối thiểu cần thiết. Nếu khóa/tài khoản bị lộ, thiệt hại bị giới hạn. |
| A | MFA / 2FA | Đăng nhập bằng ít nhất hai yếu tố, ví dụ mật khẩu + mã TOTP. Bắt buộc cho admin. |
| B | TOTP | Mã ngắn đổi theo thời gian trong ứng dụng Authenticator. Chống lộ mật khẩu nhưng vẫn cần chống phishing. |
| B | AAL1 / AAL2 | Mức đảm bảo xác thực của Supabase: một yếu tố / có thêm MFA. Action admin nhạy cảm cần AAL2. |
| B | Token | Chuỗi đại diện quyền/phiên/yêu cầu. Token phải có phạm vi và thời hạn phù hợp, không log bừa. |
| B | JWT | Token có payload và chữ ký. Payload đọc được, không phải nơi cất secret; phải xác minh chữ ký/expiry. |
| A | RLS | Row Level Security của Postgres/Supabase, lọc quyền ở từng row. Là phòng thủ thứ hai, không thay thế server authorization. |
| A | Anon key | Khóa Supabase được phép xuất hiện ở client; quyền thực tế vẫn bị RLS hạn chế. “Công khai” không nghĩa là có mọi quyền. |
| A | Service-role key | Khóa server toàn quyền có thể bỏ qua RLS. Lộ khóa này là sự cố nghiêm trọng. |
| A | Secret | Thông tin phải giữ kín: service key, webhook secret, cron secret. Không commit, không gửi client, không log. |
| B | Hash | Biến dữ liệu một chiều thành dấu vân tay. Dùng cho password/token phù hợp; hash không phải mã hóa. |
| B | Encryption | Mã hóa có khóa để giải mã. TLS bảo vệ khi truyền; dữ liệu nhạy cảm có thể cần bảo vệ khi lưu. |
| A | Input validation | Kiểm loại, độ dài, format, enum và giới hạn. Đây không phải bước duy nhất chống injection nhưng là nền tảng. |
| B | Output encoding | Biến dữ liệu thành dạng an toàn theo ngữ cảnh HTML/URL/JS để tránh chạy như code. |
| A | XSS | Kẻ xấu làm dữ liệu trở thành JavaScript chạy trong browser. Cẩn thận HTML tùy ý, URL và SVG upload. |
| A | CSRF | Lợi dụng phiên đăng nhập của nạn nhân để gửi mutation từ website khác. Kiểm Origin, SameSite và cơ chế anti-CSRF phù hợp. |
| B | SSRF | Lừa server gọi URL nội bộ/nhạy cảm. Không fetch URL tùy ý từ input user. |
| A | SQL injection | Input biến thành câu SQL ngoài ý muốn. Dùng parameterized query/ORM đúng cách, không nối chuỗi SQL. |
| B | Brute force | Thử rất nhiều mật khẩu/mã đơn/coupon. Dùng rate limit, mã khó đoán, MFA và cảnh báo. |
| A | Rate limiting | Giới hạn số request theo IP/user/action trong một khoảng thời gian để giảm abuse và đốt quota. |
| B | Turnstile | Công cụ Cloudflare đánh giá/challenge bot cho form công khai. Không thay thế authorization hoặc rate limit. |
| A | HMAC | Chữ ký dùng secret chung để chứng minh payload không bị sửa và đến từ bên biết secret. Dùng cho IPN/webhook. |
| A | Idempotency key | Khóa nhận diện một hành động để retry/double-click không tạo hai đơn hoặc xử lý hai lần. |
| B | Replay attack | Gửi lại request/chữ ký cũ để lặp tác dụng. Chống bằng idempotency, timestamp/nonce theo giao thức. |
| B | Presigned URL | URL có quyền và thời hạn ngắn để upload/download storage mà không lộ secret. |
| B | Magic bytes | Byte đầu cho biết loại file thật. Không tin phần mở rộng hoặc MIME do client khai. |
| B | Re-encode image | Giải mã và tạo lại ảnh sạch, loại metadata/payload ẩn tốt hơn chỉ đổi tên file. |
| A | Audit log | Nhật ký ai làm gì, lúc nào, trước/sau ra sao. Không phải log debug và không cho sửa tùy ý. |
| B | PII / dữ liệu cá nhân | Dữ liệu nhận diện/liên quan cá nhân như tên, SĐT, địa chỉ, ảnh thiết bị. Cần thu tối thiểu và bảo vệ vòng đời. |
| B | Threat model | Liệt kê tài sản, kẻ tấn công, đường tấn công, kiểm soát và rủi ro còn lại trước khi code. |

---

## 6. Nghiệp vụ thương mại điện tử

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Catalog | Hệ thống danh mục bán hàng: category, brand, product, variant, thuộc tính và ảnh. |
| A | Category | Nhóm sản phẩm, ví dụ Điện gia dụng → TV. Cần cấu trúc cây và slug ổn định. |
| A | Brand | Thương hiệu sản phẩm như Sony, Samsung; khác thương hiệu cửa hàng Điện Tử Hưng Phát. |
| A | Product | Khái niệm sản phẩm chung, ví dụ “iPhone 15 Pro Max”. Không nhất thiết là đơn vị nằm trong kho. |
| A | Variant | Phiên bản bán cụ thể, ví dụ 256GB màu Titan. Variant có SKU, giá và tồn kho riêng. |
| A | SKU | Mã nội bộ duy nhất cho một variant có thể bán/quản kho. |
| B | Slug | Đoạn URL dễ đọc như `iphone-15-pro-max`; phải unique trong phạm vi và có redirect khi đổi. |
| B | Attribute | Thuộc tính mô tả/lọc sản phẩm: kích thước, công suất, độ phân giải. |
| A | Inventory | Hệ thống biết hàng ở đâu, bao nhiêu và vì sao số lượng thay đổi. |
| B | Stock movement | Một biến động kho +/− có lý do, tham chiếu và tác nhân. |
| B | Reservation | Giữ tạm hàng cho checkout chưa hoàn tất. MVP chọn trừ kho rồi tự hoàn khi hết hạn, một biến thể đơn giản hơn. |
| A | Cart / giỏ hàng | Ý định mua tạm thời; giá trong cart phải được server tính lại khi checkout. |
| A | Checkout | Quy trình thu thông tin, kiểm tra giá/kho/ship và tạo đơn. Không đồng nghĩa thanh toán đã thành công. |
| A | Order | Cam kết giao dịch được hệ thống ghi nhận, gồm snapshot item, tổng tiền, khách nhận và state machine. |
| B | Order item | Một dòng hàng trong đơn, giữ snapshot SKU/tên/giá/số lượng tại lúc mua. |
| A | Fulfillment | Các bước sau khi có đơn: xác nhận, đóng gói, giao, hoàn tất/hủy/hoàn hàng. |
| A | State machine | Quy định đơn chuyển trạng thái nào sang trạng thái nào và side effect kèm theo. |
| A | Pricing | Quy tắc tìm ra giá hiệu lực trên server, gồm giá thường, giá sale và điều kiện. |
| B | Compare-at price | Giá gạch ngang để so với giá sale; cần quy tắc minh bạch, tránh “giảm giá ảo”. |
| B | Promotion | Chương trình khuyến mãi có điều kiện/thời gian/phạm vi. |
| B | Coupon | Mã giảm giá có rule, giới hạn lượt và chống race condition. |
| A | Price snapshot | Giá được chụp vào đơn; sau này admin đổi giá sản phẩm không được đổi lịch sử đơn. |
| B | Guest checkout | Khách đặt hàng không cần tài khoản. Giảm ma sát nhưng tra cứu phải chống dò thông tin. |
| B | Reconciliation / đối soát | So dữ liệu đơn, payment và sao kê/cổng để phát hiện thiếu, trùng hoặc lệch tiền. |
| B | Repair ticket | Phiếu theo dõi một thiết bị sửa chữa, trạng thái, mô tả lỗi, ảnh và lịch sử xử lý. |
| B | Quote / báo giá | Đề xuất chi phí sửa chữa cần khách duyệt trước khi làm; để Phase 2. |

---

## 7. Thanh toán

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | COD | Thanh toán khi nhận hàng. Không có IPN tiền online nhưng vẫn cần xác nhận/giao/thu tiền/đối soát. |
| A | VietQR | Chuẩn QR chuyển khoản ngân hàng. MVP sinh QR và admin xác nhận tiền thủ công. QR hiển thị không chứng minh tiền đã vào. |
| A | Payment | Bản ghi về một lần/ý định thanh toán, tách khỏi Order vì một đơn có thể thử thanh toán nhiều lần. |
| B | PSP / payment provider | Nhà cung cấp dịch vụ thanh toán như VNPay. |
| B | Merchant account | Tài khoản đơn vị bán hàng đã được PSP duyệt để nhận thanh toán. |
| A | Redirect | Chuyển khách sang trang PSP để thanh toán rồi quay lại. Trang quay lại chỉ phục vụ UX, không phải nguồn sự thật. |
| A | Return URL | URL PSP đưa browser của khách quay về. Browser có thể đóng hoặc giả request nên không dùng để đánh dấu paid. |
| A | Webhook / IPN | PSP gọi trực tiếp server để báo kết quả. Chỉ tin sau khi verify chữ ký và đối chiếu dữ liệu. |
| A | Signature verification | Tính lại chữ ký theo tài liệu PSP trên raw/canonical payload rồi so an toàn. Sai chữ ký phải từ chối. |
| A | Idempotent webhook | Cùng event gửi nhiều lần chỉ thay đổi trạng thái một lần. PSP luôn có thể retry. |
| B | Payment adapter | Lớp chuyển giao thức riêng của VNPay thành interface chung của module Payment. |
| B | Payment status | Trạng thái như pending, paid, failed, cancelled, refunded; chuyển đổi phải có rule. |
| B | Refund | Hoàn tiền qua quy trình PSP hoặc thủ công; không chỉ đổi chữ `paid` thành `refunded`. |
| B | Payment mismatch | Số tiền/mã đơn/provider report không khớp DB; phải flag để đối soát, không tự đánh paid. |

---

## 8. Công việc nền, email và tích hợp

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Job | Một việc cần chạy ngoài request chính, ví dụ gửi email hoặc hủy đơn chờ chuyển khoản quá hạn. |
| B | Queue | Hàng đợi job. MVP dùng bảng Postgres thay vì Redis/message broker riêng. |
| A | Cron | Bộ kích hoạt theo lịch. Cron đánh thức worker; nó không tự bảo đảm job chạy đúng một lần. |
| B | Retry | Chạy lại khi lỗi tạm thời. Chỉ an toàn khi handler idempotent và có giới hạn. |
| B | Backoff | Tăng thời gian chờ giữa các lần retry để tránh dồn tải vào dịch vụ đang lỗi. |
| B | Dead-letter | Nơi/trạng thái giữ job đã fail quá số lần để con người xử lý. Không được im lặng bỏ mất job. |
| B | Outbox pattern | Ghi nghiệp vụ và ý định phát event/job trong cùng transaction, rồi worker gửi sau; tránh “đơn đã tạo nhưng email/job biến mất”. |
| B | Webhook | Callback HTTP từ hệ thống ngoài. Ngoài payment còn có thể dùng cho giao hàng hoặc đối soát ngân hàng. |
| B | SPF / DKIM / DMARC | Cấu hình DNS giúp email từ domain được xác thực, giảm giả mạo và vào spam. |

---

## 9. Git, môi trường và triển khai

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Repository / repo | Thư mục dự án được Git theo dõi, gồm code, migration và tài liệu. |
| A | Git | Hệ thống ghi lịch sử thay đổi file để so sánh, quay lại và cộng tác. |
| A | Commit | Một mốc thay đổi có nội dung và thông điệp rõ. Không phải backup toàn bộ production data. |
| B | Branch | Nhánh phát triển tách khỏi `main` để làm và review thay đổi. |
| B | Pull Request / PR | Yêu cầu hợp nhất branch, kèm diff, kiểm tra tự động và review. |
| A | Diff | Phần dòng thêm/xóa/sửa. Đây là thứ bạn nên đọc sau mỗi lát cắt code. |
| A | Dependency / package | Thư viện dự án cài từ npm. Mỗi package là code bên ngoài và rủi ro supply chain cần quản lý. |
| A | Lockfile | Ghim phiên bản dependency chính xác để máy/CI cài cùng kết quả. |
| B | Semantic Versioning | Cách đánh phiên bản major.minor.patch; major thường có breaking changes, nhưng vẫn phải đọc release notes. |
| A | Dev environment | Môi trường phát triển trên máy, dùng dữ liệu giả/test. |
| B | Staging | Môi trường gần production để thử tích hợp và migration trước khi mở cho khách. Ngân sách Free có thể khiến staging dùng local/preview có giới hạn. |
| A | Production | Môi trường khách thật dùng, chứa đơn và dữ liệu thật. Quyền và thay đổi phải chặt nhất. |
| A | Deploy | Đưa một phiên bản ứng dụng lên môi trường chạy. |
| A | Rollback | Quay ứng dụng về phiên bản trước khi release lỗi. Rollback code không tự rollback database. |
| A | CI | Hệ thống tự chạy lint, typecheck, test, build khi có thay đổi. |
| B | CD | Tự động/được phê duyệt đưa bản đã kiểm tra lên môi trường. |
| B | Feature flag | Công tắc bật/tắt tính năng không cần gỡ toàn bộ deploy, ví dụ tắt VNPay khi có sự cố. |
| B | Secret rotation | Thay khóa bí mật cũ bằng khóa mới khi định kỳ hoặc nghi bị lộ. |

---

## 10. Kiểm thử và chất lượng

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Test case | Một tình huống, input, hành động và kết quả mong đợi. Bao gồm cả đường sai và cạnh tranh. |
| A | Unit test | Test một rule/use case nhỏ, nhanh, không cần mạng hoặc database thật khi kiến trúc tách tốt. |
| A | Integration test | Test sự phối hợp với database/framework/provider sandbox. |
| A | E2E test | Test hành trình gần người dùng thật qua UI và server, ví dụ xem SP → giỏ → COD. |
| B | Contract test | Kiểm format/giao thức giữa module hoặc với provider để thay đổi một bên không âm thầm phá bên kia. |
| A | Security test | Chủ động thử sai quyền, sửa giá, replay webhook, upload độc hại, dò tra cứu. |
| B | Race/concurrency test | Gửi thao tác đồng thời để chứng minh không oversell/dùng coupon vượt lượt. |
| B | Smoke test | Bộ kiểm tra ngắn chứng minh hệ thống/tính năng quan trọng còn sống sau deploy/restore. |
| A | Regression | Lỗi cũ quay lại hoặc tính năng đang tốt bị thay đổi mới làm hỏng. Test tự động giúp chặn. |
| A | Acceptance criteria / AC | Điều kiện đo được để coi công việc hoàn thành. “Nhìn đẹp” không phải AC đủ rõ. |
| A | Definition of Done | Bộ điều kiện chung: code, test, security, docs, rollback và review đều xong. |
| B | Mock | Đối tượng giả được lập trình kỳ vọng cuộc gọi; dùng quá nhiều làm test bám implementation. |
| B | Fake / in-memory adapter | Cài đặt đơn giản nhưng hoạt động thật trong bộ nhớ; tốt để test use case qua port. |

---

## 11. Vận hành và khả năng phục hồi

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Log | Bản ghi sự kiện có cấu trúc để điều tra. Không ghi secret/PII không cần thiết. |
| B | Metric | Số đo theo thời gian, ví dụ request lỗi, checkout latency, job backlog. |
| C | Trace | Dấu đường đi của một request qua nhiều thành phần; hữu ích khi luồng phức tạp. |
| A | Observability | Khả năng hiểu hệ thống đang xảy ra gì từ log, metric, trace và tín hiệu nghiệp vụ. |
| A | Monitoring | Theo dõi điều kiện đã biết và báo động, ví dụ health fail hoặc DB đạt 80%. |
| A | Alert | Thông báo cần hành động. Alert phải có owner và runbook; quá nhiều alert giả sẽ bị bỏ qua. |
| A | Health check | Endpoint/tín hiệu kiểm tra app và dependency cốt lõi còn dùng được; không lộ chi tiết nhạy cảm. |
| B | Sentry | Dịch vụ thu lỗi frontend/backend; phải scrub dữ liệu cá nhân. |
| B | SLI | Chỉ số đo thực tế như tỷ lệ request thành công. |
| B | SLO | Mục tiêu cho SLI, ví dụ uptime 99,5%. Không đồng nghĩa cam kết pháp lý với khách. |
| C | SLA | Cam kết dịch vụ có hậu quả/hợp đồng nếu không đạt. Free tier thường không có SLA. |
| B | p50 / p95 / p99 | Phân vị latency. p95 = 95% request nhanh hơn hoặc bằng con số đó; hữu ích hơn trung bình đơn giản. |
| A | Backup | Bản sao dữ liệu dùng để phục hồi. Backup chưa thử restore thì chưa chứng minh dùng được. |
| A | Restore | Phục hồi dữ liệu từ backup và kiểm tra ứng dụng đọc đúng. |
| A | RPO | Chấp nhận mất tối đa bao nhiêu dữ liệu theo thời gian. Backup 6 giờ/lần thường cho RPO tối đa xấp xỉ 6 giờ. |
| A | RTO | Chấp nhận mất bao lâu để hệ thống chạy lại sau sự cố. |
| B | PITR | Phục hồi database về thời điểm gần cụ thể từ log; không có trong phương án Supabase Free hiện tại. |
| A | Disaster Recovery / DR | Kế hoạch phục hồi khi sự cố lớn: mất DB, lộ key, hỏng deploy, mất domain. |
| A | Runbook | Hướng dẫn thao tác từng bước khi deploy, backup, restore hoặc xử lý sự cố. |
| B | Vendor lock-in | Chi phí/khó khăn khi rời nhà cung cấp. Giảm bằng chuẩn SQL, adapter và backup độc lập. |

---

## 12. Hiệu năng, UX và SEO

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| A | Performance | Tốc độ và mức tài nguyên trong điều kiện đo cụ thể. Không chỉ là cảm giác “web nhanh”. |
| A | Latency | Thời gian từ lúc gửi yêu cầu tới lúc nhận kết quả. |
| B | Throughput | Số công việc/request xử lý được trong một khoảng thời gian. |
| A | CDN | Mạng máy chủ gần người dùng giữ bản cache ảnh/trang để tải nhanh và giảm tải origin. |
| B | TTFB | Thời gian tới byte đầu tiên; phản ánh mạng, cache và thời gian server bắt đầu trả dữ liệu. |
| A | Core Web Vitals | Nhóm chỉ số trải nghiệm web thực tế như LCP, INP, CLS. |
| B | LCP | Thời gian nội dung chính lớn nhất xuất hiện. Ảnh hero/PDP thường ảnh hưởng mạnh. |
| B | INP | Độ trễ phản hồi tương tác trong suốt phiên. JavaScript nặng làm xấu INP. |
| B | CLS | Mức bố cục nhảy bất ngờ. Ảnh không có kích thước và nội dung chèn muộn thường gây ra. |
| A | Responsive design | Giao diện thích ứng mobile/tablet/desktop; admin cũng phải dùng tốt trên điện thoại. |
| B | Accessibility / a11y | Khả năng dùng với bàn phím, screen reader, độ tương phản và các hạn chế khác. |
| A | UX | Trải nghiệm hoàn thành mục tiêu: tìm hàng, tin tưởng, checkout, tra cứu, đặt lịch sửa. |
| B | Design system | Bộ token/component/quy tắc chung giữ giao diện nhất quán và bảo trì được. |
| A | SEO | Tối ưu để công cụ tìm kiếm hiểu, index và xếp hạng nội dung phù hợp. |
| B | Metadata | Tiêu đề, mô tả, Open Graph… mô tả trang cho search/social. |
| B | Structured data / JSON-LD | Dữ liệu có cấu trúc mô tả Product, Offer, LocalBusiness cho máy tìm kiếm. Không bảo đảm rich result. |
| B | Sitemap | Danh sách URL giúp crawler phát hiện trang. Không thay thế liên kết nội bộ/chất lượng nội dung. |
| B | `robots.txt` | Hướng dẫn crawler được crawl đâu; không phải cơ chế bảo mật. |
| B | Canonical URL | URL đại diện cho nội dung để giảm trùng lặp do filter/query. |
| B | 301 redirect | Chuyển vĩnh viễn URL cũ sang URL mới, giữ trải nghiệm và phần lớn tín hiệu SEO khi đổi slug. |
| B | Analytics | Thu event để hiểu funnel/hành vi. Phải có consent và không dùng GA làm sổ doanh thu. |
| B | Funnel | Chuỗi bước như `view_item → add_to_cart → begin_checkout → purchase`, dùng tìm chỗ khách rơi. |

---

## 13. Dữ liệu cá nhân và tuân thủ

| Mức | Thuật ngữ | Giải thích trong dự án |
|---|---|---|
| B | Consent | Sự đồng ý có thông tin và phù hợp mục đích; không pre-tick hoặc gộp mơ hồ. Chi tiết pháp lý phải được tư vấn xác nhận. |
| B | Data minimization | Chỉ thu dữ liệu thật sự cần. Form sửa chữa không nên hỏi ngày sinh nếu không dùng. |
| B | Purpose limitation | Dữ liệu thu để giao hàng không tự động được dùng quảng cáo nếu chưa có căn cứ/đồng ý phù hợp. |
| B | Retention | Quy định giữ mỗi loại dữ liệu bao lâu rồi xóa/ẩn danh theo nghĩa vụ thực tế. |
| B | Anonymization | Biến dữ liệu để không còn liên kết hợp lý với cá nhân; khác việc chỉ che trên UI. |
| B | Data processor/provider | Bên xử lý dữ liệu thay cửa hàng như hosting, email, analytics; cần hiểu dữ liệu nào được gửi đi đâu. |
| B | Cross-border data transfer | Dữ liệu khách được lưu/xử lý ngoài Việt Nam; nghĩa vụ cụ thể cần chuyên gia pháp lý xác minh. |
| B | GPKD / MST | Giấy đăng ký kinh doanh / mã số thuế của chủ thể bán hàng. |
| B | BCT / online.gov.vn | Bộ Công Thương và cổng thủ tục liên quan website TMĐT. Quy trình phải kiểm tra theo quy định hiện hành. |
| B | HĐĐT | Hóa đơn điện tử. Hình thức/nghĩa vụ phụ thuộc mô hình và doanh thu, cần kế toán xác nhận. |

---

## 14. Thứ tự học đề xuất

### Vòng 1 — học ngay trước M01

Client, server, request, response, HTTP, cookie, session, database, API, Server Component, Client Component, Server Action, Route Handler, module, service/use case, invariant, transaction, cache, authentication, authorization, secret.

### Vòng 2 — trước khi dựng nền M0b

Git, commit, diff, dependency, lockfile, dev/staging/production, environment variable, migration, CI, deploy, rollback, RLS, anon key, service-role key, unit/integration/E2E test.

### Vòng 3 — học theo module

- M03: Product, Variant, SKU, Category, Attribute, Slug.
- M04: Inventory, Ledger, Stock Movement, Race Condition, Row Lock.
- M05: Pricing, Promotion, Coupon, Snapshot.
- M06–M07: Cart, Checkout, Order, State Machine, Fulfillment.
- M08: PSP, Redirect, Return URL, IPN, HMAC, Idempotency, Reconciliation.
- M11: Job, Queue, Cron, Retry, Dead-letter, Outbox.
- M12: ISR, CDN, SEO, FTS, JSON-LD, Core Web Vitals.
- M13: Presigned URL, Magic Bytes, Re-encode, XSS.
- M14: PII, Consent, Retention, Anonymization.
- M15: Observability, SLO, RPO, RTO, Backup, Restore, DR.

## 15. Bài kiểm tra nền tảng

Bạn đã đủ nền để tiếp tục M01 khi có thể giải thích bằng lời của mình:

1. Client, server và database khác nhau thế nào?
2. Request khác response thế nào?
3. Frontend và backend có thể cùng nằm trong Next.js nhưng vì sao vẫn phải tách trách nhiệm?
4. Vì sao dữ liệu từ browser phải xem là không đáng tin?
5. Server Component và Client Component phù hợp với loại việc nào?
6. Service/use case khác Route Handler hoặc React component ở đâu?
7. Invariant là gì? Nêu một invariant của cửa hàng.
8. Transaction giải quyết tình huống tạo đơn và trừ kho thế nào?
9. Authentication khác authorization thế nào?
10. Vì sao service-role key tuyệt đối không được xuống client?
