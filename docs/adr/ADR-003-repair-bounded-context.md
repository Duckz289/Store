# ADR-003: Repair là bounded context độc lập

- Trạng thái: Accepted for implementation in internal development
- Ngày: 06/08/2026
- Người quyết định: Chủ dự án

## Bối cảnh

Repair có vòng đời intake, diagnosis, quote, approval, repair, QA và return khác Order/Fulfillment. Ép repair case vào Order sẽ làm sai state machine commerce, trộn contact/device PII vào dữ liệu bán hàng và tạo dependency khó nâng Medusa.

Medusa 2.18.0 cô lập module: custom module không được quan hệ trực tiếp hoặc resolve service module khác. Official module link, Query và workflow là extension point cho use case xuyên module.

## Quyết định

- Tạo module `repair` với aggregate root `repair_case` và các model con do module sở hữu.
- Không tạo commerce Order khi tiếp nhận repair; Order chỉ là optional reference cho nguồn mua/bảo hành.
- Liên kết optional tới Customer, Product, Product Variant, Order, User, Inventory Item và Stock Location bằng module link theo chiều custom → core.
- Lưu snapshot contact/device/catalog/order/quote/part/technician cần cho lịch sử. Link mất không làm mất snapshot.
- Tất cả orchestration xuyên module nằm trong workflow. Route và scheduled job không ghi database trực tiếp.
- Parts usage điều chỉnh tồn kho qua public Inventory Module service dưới Locking Module, có idempotency và compensation; Repair không sở hữu hay cập nhật bảng inventory.
- State machine dùng enum và transition matrix trong `docs/repair-service-design.md`; status history append-only ở API.
- Quote draft được sửa, nhưng submitted/approved/rejected/superseded là immutable. Revision mới thay cho sửa âm thầm.
- PII tách thành contact/device/attachment data với policy riêng và retention/anonymization; security audit không nhận raw PII/token/internal note.
- Admin mở rộng bằng UI route/widget chính thức; không override Admin core.

## Hệ quả

- Không có dependency ngược từ core Medusa sang Repair.
- Query across module phải dùng module link/Query nên link table không có FK; reconciliation phải phát hiện stale link nhưng không xóa lịch sử.
- Consistency xuyên Repair/Inventory/Security là workflow saga. Compensation xử lý lỗi đồng bộ; reconciliation xử lý crash/compensation failure.
- Locking backend phân tán là yêu cầu production nếu chạy nhiều backend instance; in-memory locking chỉ phù hợp development một process.
- Customer quote decision dùng capability token hash, purpose và expiry. Raw token chỉ trả một lần và không ghi audit/log.

## Không chọn

- Dùng Order/Return làm repair case: state machine và ownership sai.
- Thêm cột repair vào core Customer/Product/Order: tạo fork và dependency ngược.
- Lưu file blob trong repair table: bỏ qua File/storage adapter và tăng rủi ro upload.
- Cập nhật tồn kho trực tiếp hoặc lưu một số lượng tồn riêng trong Repair: tạo hai nguồn sự thật.

## Bằng chứng kiểm chứng

- Unit test transition/invariant/idempotency.
- Module integration test persistence, quote immutability, snapshot survival và status history.
- HTTP integration test RBAC, MFA, public serializer/lookup, quote decision replay và parts inventory compensation.
- Reconciliation test không tạo duplicate issue và không tự sửa financial/inventory state.
