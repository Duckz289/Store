# Runbook đối soát VietQR thủ công

## Phạm vi

Runbook áp dụng cho VietQR QR-only khi chưa có bank/provider API. Reconciliation job chỉ phát hiện sai lệch nội bộ; nhân viên phải kiểm tra sao kê ngân hàng thật trước mọi financial transition.

## Phân quyền

- Finance: xem payment/reconciliation, ghi observation và xác nhận exact payment.
- Owner: toàn quyền Finance, resolve issue, cancel và xác nhận refund thủ công.
- Support/Auditor: chỉ xem trạng thái đã redact theo policy; không capture/refund.
- Mọi mutation yêu cầu MFA step-up và idempotency key.

## Xử lý issue

### Expired pending session

1. Tra reference trong sao kê từ lúc tạo QR đến hiện tại.
2. Nếu không có giao dịch, thực hiện cancel/order handling bằng workflow được phê duyệt; không sửa DB.
3. Nếu tiền đến muộn, ghi observation `expired`, giữ pending và Owner quyết định hoàn tiền hoặc xử lý ngoại lệ. Không force-paid.

### Underpaid

1. Ghi observation `underpaid`; không capture.
2. Liên hệ customer bằng kênh đã duyệt để thanh toán phần thiếu với cùng case/reference hoặc hoàn số tiền đã nhận.
3. Chỉ confirm khi bằng chứng tổng hợp và quy trình phiên bản sau hỗ trợ aggregation; milestone hiện tại yêu cầu exact single transfer.

### Overpaid

1. Ghi observation `overpaid`; không capture.
2. Owner xác minh customer/account hoàn tiền ngoài hệ thống.
3. Ghi manual refund receipt sau khi ngân hàng trả transaction reference. Không dùng ảnh biên lai.

### Wrong reference

1. Không gán giao dịch theo tên người gửi hoặc ảnh chụp.
2. Dùng amount/time và dữ liệu ngân hàng để điều tra; cần Owner phê duyệt mapping ngoại lệ.
3. Milestone hiện tại không cho mapping ngoại lệ tự động; giữ issue mở hoặc hoàn tiền.

### Exact observation nhưng thiếu capture

1. Kiểm tra command receipt, Payment Session, Payment và Capture.
2. Chạy lại đúng idempotency key nếu request trước dừng giữa chừng.
3. Nếu cùng key khác payload, dừng và điều tra; không tạo key mới để vượt conflict.

### Captured nhưng thiếu observation/proof

1. Xem đây là incident mức cao; chặn fulfillment nếu còn an toàn.
2. Kiểm tra audit integrity, actor, MFA assurance và thay đổi session data.
3. Không tạo observation hồi tố để che sai lệch. Ghi incident/audit và Owner quyết định repair workflow.

### Duplicate bank transaction reference

1. Không capture session thứ hai.
2. So khớp reference/amount/time với sao kê và command receipt.
3. Resolve issue chỉ sau khi xác định payment duy nhất; mọi hoàn tiền dùng workflow refund thủ công.

## Quy tắc không được vi phạm

- Không sửa bảng Payment/Order/VietQR bằng SQL.
- Không đánh dấu paid từ return URL, email, chat, OCR hoặc ảnh biên lai.
- Không đưa account number đầy đủ, bank transaction reference đầy đủ, note sao kê hoặc secret vào audit/ticket.
- Không tự tạo webhook/polling nếu chưa có contract và credential chính thức.
- Không đóng issue chỉ vì storefront hiển thị trang thành công.
