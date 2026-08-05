# Architecture Learning Pack

Tài liệu này theo dõi tiến độ học và duyệt 15 module của website Điện Tử Hưng Phát.

Tài liệu nền dùng xuyên suốt: [Từ điển thuật ngữ dự án](../GLOSSARY.md).

## Quy ước trạng thái

- `Chưa học`: chưa bắt đầu đọc cùng Codex.
- `Đang học`: đang đọc, hỏi đáp hoặc còn câu tự kiểm tra chưa rõ.
- `Đã duyệt`: đã hiểu mục tiêu, ranh giới và rủi ro chính; được phép chuyển sang module kế tiếp.
- Việc duyệt tài liệu **không đồng nghĩa** cho phép viết code. M0b chỉ bắt đầu sau khi toàn bộ 15 module được duyệt.

## Tiến độ

| Module | Chủ đề | Trạng thái | Ngày duyệt | Ghi chú |
|---|---|---|---|---|
| M01 | Kiến trúc ứng dụng và vòng đời request | Đã duyệt | 31/07/2026 | Đã hiểu request, service, transaction, cache và ranh giới Orders/Payments |
| M02 | Identity, Authentication, MFA, RBAC | Đã duyệt | 31/07/2026 | Đã hiểu AuthN/AuthZ, AAL, RLS, key security và luồng recovery |
| M03 | Catalog, Category, Brand, Product, SKU | Đã duyệt | 31/07/2026 | Đã hiểu Category/Product/Variant/SKU, archive, slug và ranh giới Catalog |
| M04 | Inventory và biến động kho | Đã duyệt | 31/07/2026 | Đã hiểu ledger, atomic update, rollback, audit và idempotent restock |
| M05 | Pricing, Promotion, Coupon | Đã duyệt | 05/08/2026 | Đã hiểu giá chốt, snapshot Order, promotion, coupon atomic và rollback |
| M06 | Guest Cart và Checkout | Chưa học | — | — |
| M07 | Order và Fulfillment | Chưa học | — | — |
| M08 | COD, VietQR và VNPay | Chưa học | — | — |
| M09 | Đặt lịch và phiếu sửa chữa | Chưa học | — | — |
| M10 | Admin Dashboard và Audit Log | Chưa học | — | — |
| M11 | Notification và Background Job | Chưa học | — | — |
| M12 | Search, SEO và Product Discovery | Chưa học | — | — |
| M13 | Upload và lưu trữ media an toàn | Chưa học | — | — |
| M14 | Privacy, Consent và tuân thủ TMĐT | Chưa học | — | — |
| M15 | Performance, Monitoring, Backup và DR | Chưa học | — | — |

## Cách học mỗi module

1. Đọc tài liệu và liên hệ với hoạt động thật của cửa hàng.
2. Tự mô tả lại luồng chính bằng lời của mình.
3. Trả lời các câu tự kiểm tra mà không nhìn đáp án.
4. Ghi lại điều chưa rõ vào phần ghi chú.
5. Chỉ đánh dấu `Đã duyệt` sau khi giải thích được mục đích, ranh giới, bất biến và rủi ro chính.
