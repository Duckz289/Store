# Tích hợp vận chuyển Việt Nam

## Hiện có

Seed tạo một service zone toàn quốc, manual fulfillment provider và “Giao hàng tiêu chuẩn”:

- 30.000 ₫ khi `item_total < 1.000.000 ₫`.
- Miễn phí khi `item_total >= 1.000.000 ₫`.

Đây là cấu hình khởi tạo, không phải bảng giá production.

## Tích hợp hãng vận chuyển

GHN, GHTK, Viettel Post hoặc đối tác khác phải được thêm bằng Fulfillment Provider:

- `validateFulfillmentData` kiểm tra tỉnh/thành, phường/xã và service code.
- `calculatePrice` gọi API báo giá server-to-server với timeout và retry có giới hạn.
- `createFulfillment` tạo vận đơn idempotent và lưu tracking/external shipment ID.
- `cancelFulfillment` xử lý trạng thái không thể hủy một cách tường minh.
- Webhook tracking được xác minh, deduplicate và ánh xạ vào fulfillment events.

Mô hình địa chỉ không hard-code quận/huyện. Form hiện dùng `province` cho tỉnh/thành, `city` cho phường/xã, `address_1` cho địa chỉ chi tiết và `address_2` cho ghi chú giao hàng. Khi carrier yêu cầu district code, lưu mapping ở adapter/provider thay vì biến nó thành ràng buộc toàn hệ thống.
