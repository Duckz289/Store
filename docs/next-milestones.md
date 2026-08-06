# Kế hoạch milestone sau security triage

Thứ tự dưới đây là bắt buộc. Mỗi milestone kế thừa checklist M01–M15 nhưng dùng extension point chính thức của Medusa; không sửa core và không tái tạo module framework đã có.

## 1. RBAC, MFA enforcement và audit log

Mục tiêu: khóa bề mặt Admin trước khi thêm payment/carrier integration.

- Lập ma trận role/permission tối thiểu: owner, catalog, order/fulfillment, finance, support và read-only auditor.
- Dùng primitive Auth/MFA của Medusa 2.18; thêm policy enforcement chặn Admin action nhạy cảm khi user chưa enroll hoặc session chưa đạt MFA.
- Ghi append-only audit event cho login/MFA, thay đổi role, catalog/price/inventory, order/payment/refund/fulfillment và security setting.
- Không ghi password, token, payment credential hay PII đầy đủ; có correlation ID, actor, action, resource, before/after đã redact, timestamp và outcome.
- Test: privilege escalation, horizontal access, MFA bypass/recovery, session revoke, tamper resistance và export audit.

Exit criteria: role matrix được review; mọi Admin route nhạy cảm có authorization test; MFA enforcement và Admin authentication smoke pass; audit event truy vết được một order end-to-end.

Trạng thái 06/08/2026: hoàn tất cho development/milestone nội bộ, chưa production-approved.

- Native RBAC 2.18.0 được đăng ký và migrate; sáu role được reconcile idempotent, Owner local được bootstrap bằng email tường minh.
- Tất cả Admin mutation và audit export yêu cầu MFA step-up gắn với bearer/session; API key không thể giả human assurance; logout revoke assurance của session.
- Audit module có redaction, correlation ID, nonce + SHA-256 integrity check, JSON export và subscriber lifecycle cho order/payment/refund/fulfillment/product/inventory.
- Integration tests bao phủ privilege escalation, challenge khác identity, mã TOTP sai, TOTP và recovery-code step-up, session revoke, tamper detection, audit export và chuỗi order `placed → updated → completed`.
- Giới hạn production còn mở được ghi trong ADR-002: harden quyền DB append-only, external immutable export/SIEM, reverse-proxy logging cho native RBAC denial và rate limit MFA.

## 2. Repair service module

Mục tiêu: quản lý yêu cầu sửa chữa mà không làm biến dạng Order core.

- Custom module cho repair case, device/item snapshot, diagnosis, quote, approval, parts, technician assignment, SLA và status history.
- Workflow cho intake → diagnosis → quote → customer approval → repair → QA → return/close; step phải idempotent và có compensation phù hợp.
- Link chính thức đến customer/order/product/variant khi có; snapshot dữ liệu cần giữ lịch sử.
- API route chỉ resolve/run workflow; Admin extension dùng route/widget chính thức.
- Audit, RBAC, upload an toàn, privacy retention và repair reconciliation job là acceptance criteria.

Exit criteria: state machine/invariants được tài liệu hóa; unit/integration/API tests pass; repair case có thể reconcile và không sửa core Medusa.

## 3. VietQR

Mục tiêu: payment provider module cho chuyển khoản QR có đối soát và chống ghi nhận trùng.

- Provider tạo payment session chứa amount/currency/order reference do server quyết định; QR payload không lấy amount từ client.
- Lưu immutable payment reference và expiry; không coi ảnh biên lai là bằng chứng thanh toán cuối cùng.
- Webhook/polling reconciliation có signature/allow-list nếu nhà cung cấp hỗ trợ, idempotency key và atomic state transition.
- Xử lý paid amount thiếu/thừa, expired QR, duplicate notification, refund/manual review và reconciliation job.

Exit criteria: sandbox/contract tests, replay tests, amount tampering tests, webhook idempotency và order/payment state machine pass.

## 4. VNPay

Mục tiêu: payment provider redirect/webhook hoàn chỉnh theo contract VNPay được chọn.

- Tách return URL (UX) khỏi IPN/webhook (nguồn xác nhận server).
- Canonicalize parameter, verify signature bằng constant-time comparison, kiểm tra merchant/amount/currency/order reference và timestamp.
- Idempotent authorize/capture/refund; lưu provider transaction ID; xử lý out-of-order/retry.
- Secret chỉ ở backend env/secret manager; log redact; có reconciliation job và runbook sự cố.

Exit criteria: official sandbox pass; test signature sai, replay, duplicate/out-of-order IPN, amount mismatch, timeout và refund pass.

## 5. Carrier Việt Nam

Mục tiêu: fulfillment provider/adapters có thể thay nhà vận chuyển mà không đổi Order core.

- Chuẩn hóa capability: quote, create/cancel shipment, label, pickup, tracking, COD remittance và webhook event.
- Adapter riêng cho từng carrier; mapping tỉnh/huyện/xã, service code và unit conversion được version hóa.
- Idempotency cho create shipment/webhook; lưu external shipment ID; retry có backoff/dead-letter.
- Không để carrier webhook chuyển trạng thái fulfillment lùi hoặc vượt state machine; có reconciliation job.
- PII shipping được tối thiểu hóa, mã hóa/retention theo privacy policy; monitoring theo latency/error/SLA.

Exit criteria: contract test dùng sandbox/mock chính thức; duplicate/out-of-order webhook, carrier outage, retry/reconcile và COD reconciliation pass.

## Gate chung cho mọi milestone

- Frozen install, lint, typecheck, unit/integration tests, backend/Admin build, storefront build, Store API smoke và Admin auth smoke.
- Audit lại production graph; không thêm critical/high mới chưa được xử lý hoặc exception có owner/expiry.
- ADR cho quyết định ảnh hưởng module boundary, provider contract, state machine hoặc dữ liệu lịch sử.
- Không sửa core Medusa; extension bằng module, provider, workflow, subscriber, job, API route và Admin extension chính thức.
